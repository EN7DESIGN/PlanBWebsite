// Configuration Cloudinary (À remplir par l'utilisateur ou via le widget)
const CLOUD_NAME = "planb-folio"; // L'utilisateur devra configurer ça
const UPLOAD_PRESET = "planb_preset"; // L'utilisateur devra configurer ça

let uploadedMedia = [];

// Initialisation du Widget Cloudinary
const myWidget = cloudinary.createUploadWidget({
    cloudName: CLOUD_NAME, 
    uploadPreset: UPLOAD_PRESET,
    multiple: true,
    sources: ['local'], // Uniquement upload depuis l'ordinateur/téléphone (pas de cloud/url)
    clientAllowedFormats: ['image', 'video'], // Restreindre aux médias
    showPoweredBy: false // Optionnel, plus propre
}, (error, result) => { 
    if (!error && result && result.event === "success") { 
        
        // Récupération de l'URL sécurisée brute
        let secureUrl = result.info.secure_url;
        
        // Magie Cloudinary : On injecte l'optimisation automatique (qualité et format)
        // en remplaçant "/upload/" par "/upload/f_auto,q_auto/"
        if (secureUrl.includes('/upload/')) {
            secureUrl = secureUrl.replace('/upload/', '/upload/f_auto,q_auto/');
        }

        uploadedMedia.push(secureUrl);
        updatePreview();
        checkFormValidity();
    }
});

document.getElementById("upload-widget-btn").addEventListener("click", function(){
    myWidget.open();
}, false);

function updatePreview() {
    const preview = document.getElementById('media-preview');
    preview.innerHTML = '';
    uploadedMedia.forEach(url => {
        const img = document.createElement('img');
        img.src = url;
        preview.appendChild(img);
    });
}

function checkFormValidity() {
    const name = document.getElementById('project-name').value;
    const token = document.getElementById('github-token').value;
    const btn = document.getElementById('submit-btn');
    btn.disabled = !(name && token && uploadedMedia.length > 0);
}

document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', checkFormValidity);
});

document.getElementById('admin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const status = document.getElementById('status-message');
    status.style.display = 'block';
    status.className = '';
    status.innerText = 'Mise à jour du repository GitHub...';

    const token = document.getElementById('github-token').value;
    const service = document.getElementById('service-select').value;
    const projectName = document.getElementById('project-name').value;
    const projectId = projectName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

    try {
        // 1. Récupérer le contenu actuel de data.json sur GitHub
        // On a besoin du owner et repo. On va essayer de les déduire ou demander.
        // Pour cet exemple, je vais utiliser un placeholder que l'utilisateur devra peut-être ajuster
        // Idéalement, on récupère l'info depuis l'URL actuelle si c'est déployé.
        
        // Note: Dans un environnement réel, ces infos seraient dynamiques.
        const OWNER = "EN7DESIGN"; 
        const REPO = "PlanBWebsite";
        const PATH = "data.json";

        const getUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
        const response = await fetch(getUrl, {
            headers: { 'Authorization': `token ${token}` }
        });

        if (!response.ok) throw new Error('Impossible de récupérer data.json sur GitHub. Vérifiez le token et les accès.');

        const fileData = await response.json();
        const content = JSON.parse(atob(fileData.content));

        // 2. Ajouter le nouveau projet
        const newProject = {
            id: projectId,
            name: projectName,
            thumbnail: uploadedMedia[0], // On prend la première image comme thumbnail
            media: uploadedMedia
        };

        if (!content.services[service].projects) {
            content.services[service].projects = [];
        }
        content.services[service].projects.push(newProject);

        // 3. Envoyer la mise à jour
        const updateResponse = await fetch(getUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Add project ${projectName} to ${service}`,
                content: btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2)))),
                sha: fileData.sha // Obligatoire pour updater
            })
        });

        if (updateResponse.ok) {
            status.className = 'success';
            status.innerText = 'Projet publié avec succès ! Redirection...';
            setTimeout(() => window.location.href = `folio.html?service=${service}`, 2000);
        } else {
            throw new Error('Erreur lors de la mise à jour sur GitHub.');
        }

    } catch (err) {
        status.className = 'error';
        status.innerText = err.message;
    }
});
