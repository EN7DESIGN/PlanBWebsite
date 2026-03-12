// Configuration Cloudinary (À remplir par l'utilisateur ou via le widget)
const CLOUD_NAME = "planb-folio"; 
const UPLOAD_PRESET = "planb_preset";

// État local
let uploadedThumb = null;
let uploadedMedia = [];
const OWNER = "EN7DESIGN"; 
const REPO = "PlanBWebsite";
const PATH = "data.json";

// ---- Configuration Widgets Cloudinary ----
const commonWidgetConfig = {
    cloudName: CLOUD_NAME, 
    uploadPreset: UPLOAD_PRESET,
    sources: ['local'], // Uniquement ordinateur/mobile
    clientAllowedFormats: ['image', 'video'],
    showPoweredBy: false
};

// Widget Miniature (1 seul fichier)
const thumbWidget = cloudinary.createUploadWidget({
    ...commonWidgetConfig,
    multiple: false
}, (error, result) => { 
    if (!error && result && result.event === "success") { 
        let secureUrl = result.info.secure_url;
        if (secureUrl.includes('/upload/')) {
            secureUrl = secureUrl.replace('/upload/', '/upload/f_auto,q_auto/');
        }
        uploadedThumb = secureUrl;
        updatePreview('thumb-preview', [uploadedThumb]);
        checkAddFormValidity();
    }
});

// Widget Médias (plusieurs fichiers)
const mediaWidget = cloudinary.createUploadWidget({
    ...commonWidgetConfig,
    multiple: true
}, (error, result) => { 
    if (!error && result && result.event === "success") { 
        let secureUrl = result.info.secure_url;
        if (secureUrl.includes('/upload/')) {
            secureUrl = secureUrl.replace('/upload/', '/upload/f_auto,q_auto/');
        }
        uploadedMedia.push(secureUrl);
        updatePreview('media-preview', uploadedMedia);
        checkAddFormValidity();
    }
});

// Binding Events Upload
document.getElementById("upload-thumb-btn").addEventListener("click", () => thumbWidget.open());
document.getElementById("upload-media-btn").addEventListener("click", () => mediaWidget.open());

function updatePreview(containerId, mediaArray) {
    const preview = document.getElementById(containerId);
    preview.innerHTML = '';
    mediaArray.forEach(url => {
        if (!url) return;
        const img = document.createElement('img');
        img.src = url;
        preview.appendChild(img);
    });
}

function checkAddFormValidity() {
    const context = document.getElementById('project-context').value;
    const name = document.getElementById('project-name').value;
    const token = document.getElementById('github-token').value;
    const btn = document.getElementById('submit-btn');
    btn.disabled = !(context && name && token && uploadedThumb && uploadedMedia.length > 0);
}

document.querySelectorAll('#tab-add input, #github-token').forEach(input => {
    input.addEventListener('input', checkAddFormValidity);
});

// ---- Logique Onglets ----
const tabs = document.querySelectorAll('.admin-tab');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Enlever l'actif partout
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.admin-tab-content').forEach(c => c.style.display = 'none');
        
        // Activer le tab cliqué
        tab.classList.add('active');
        const target = tab.getAttribute('data-tab');
        document.getElementById(`tab-${target}`).style.display = 'flex';

        // Clear status
        document.getElementById('status-message').style.display = 'none';
        
        // Check validity au cas où on revient sur Add
        if(target === 'add') checkAddFormValidity();
    });
});

// ---- Utilitaires API GitHub ----
async function getGithubData(token) {
    const getUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
    const response = await fetch(getUrl, {
        headers: { 'Authorization': `token ${token}` },
        cache: 'no-store' // Éviter le cache du navigateur pour lire la fresh data
    });
    if (!response.ok) throw new Error('Impossible de se connecter à GitHub. Vérifiez le token.');
    const fileData = await response.json();
    const decodedContent = decodeURIComponent(escape(atob(fileData.content)));
    return {
        content: JSON.parse(decodedContent),
        sha: fileData.sha,
        url: getUrl
    };
}

async function updateGithubData(token, url, sha, content, commitMessage) {
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: commitMessage,
            content: btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2)))),
            sha: sha
        })
    });
    if (!response.ok) throw new Error('Erreur lors de la mise à jour sur GitHub.');
}

function showStatus(message, type = '') {
    const status = document.getElementById('status-message');
    status.style.display = 'block';
    status.className = type;
    status.innerText = message;
}

// ---- Ajouter un Projet ----
document.getElementById('admin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Si on n'est pas sur le tab "add", on bloque le submit du form
    const activeTab = document.querySelector('.admin-tab.active')?.getAttribute('data-tab');
    if(activeTab !== 'add') return;

    showStatus('Publication en cours...', '');

    const token = document.getElementById('github-token').value;
    const service = document.getElementById('service-select').value;
    const projectName = document.getElementById('project-name').value;
    const projectContext = document.getElementById('project-context').value;
    const projectId = projectName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

    try {
        const ghData = await getGithubData(token);
        let dataContent = ghData.content;

        const newProject = {
            id: projectId,
            context: projectContext,
            name: projectName,
            thumbnail: uploadedThumb, // Image unique pour la card
            media: uploadedMedia // Array d'images/vidéos
        };

        if (!dataContent.services[service].projects) {
            dataContent.services[service].projects = [];
        }
        dataContent.services[service].projects.push(newProject);

        await updateGithubData(token, ghData.url, ghData.sha, dataContent, `Add project ${projectName} to ${service}`);
        
        showStatus(`Projet "${projectName}" publié avec succès !`, 'success');
        
        // Reset form
        document.getElementById('project-context').value = '';
        document.getElementById('project-name').value = '';
        uploadedThumb = null;
        uploadedMedia = [];
        updatePreview('thumb-preview', []);
        updatePreview('media-preview', []);
        checkAddFormValidity();

    } catch (err) {
        showStatus(err.message, 'error');
    }
});

// ---- Gérer les Projets (Lister & Supprimer) ----
document.getElementById('load-projects-btn').addEventListener('click', async () => {
    const token = document.getElementById('github-token').value;
    if(!token) return showStatus("Veuillez d'abord entrer votre Token GitHub (en haut).", 'error');

    showStatus('Chargement...', '');
    const service = document.getElementById('service-select').value;

    try {
        const ghData = await getGithubData(token);
        const projects = ghData.content.services[service].projects || [];
        renderProjectsList(projects, service);
        document.getElementById('status-message').style.display = 'none';
    } catch (err) {
        showStatus(err.message, 'error');
    }
});

function renderProjectsList(projects, service) {
    const listContainer = document.getElementById('projects-list');
    listContainer.innerHTML = '';

    if (projects.length === 0) {
        listContainer.innerHTML = '<p class="manage-info" style="opacity:1;">Aucun projet dans ce service temporairement.</p>';
        return;
    }

    projects.forEach((proj, index) => {
        const div = document.createElement('div');
        div.className = 'project-item';
        // Protection pour le thumbnail si c'est null (anciens projets)
        const thumbSrc = proj.thumbnail || (proj.media && proj.media[0]) || '';
        
        div.innerHTML = `
            <img src="${thumbSrc}" class="project-item__thumb" alt="Miniature">
            <div class="project-item__info">
                <span class="project-item__name">${proj.name}</span>
                <span class="project-item__id">ID: ${proj.id}</span>
            </div>
            <button type="button" class="delete-btn" data-index="${index}" data-service="${service}">Supprimer</button>
        `;
        listContainer.appendChild(div);
    });

    // Binding des boutons "Supprimer"
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', deleteProject);
    });
}

async function deleteProject(e) {
    const token = document.getElementById('github-token').value;
    const btn = e.currentTarget;
    const index = parseInt(btn.getAttribute('data-index'));
    const service = btn.getAttribute('data-service');
    
    if(!confirm('Êtes-vous sûr de vouloir supprimer définitivement ce projet ?')) return;

    btn.innerText = '...';
    btn.disabled = true;
    showStatus('Suppression en cours...', '');

    try {
        // Obtenir la dernière version en ligne
        const ghData = await getGithubData(token);
        let dataContent = ghData.content;
        
        const projName = dataContent.services[service].projects[index].name;
        
        // Retirer le projet de l'array
        dataContent.services[service].projects.splice(index, 1);

        // Envoyer la modif
        await updateGithubData(token, ghData.url, ghData.sha, dataContent, `Delete project ${projName} from ${service}`);
        
        // Re-charger la liste
        showStatus(`Projet "${projName}" supprimé avec succès !`, 'success');
        document.getElementById('load-projects-btn').click();

    } catch (err) {
        showStatus(err.message, 'error');
        btn.innerText = 'Supprimer';
        btn.disabled = false;
    }
}
