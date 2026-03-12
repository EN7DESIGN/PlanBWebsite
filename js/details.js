const LOADER_MIN_DURATION = 1800; // ms — durée minimale d'affichage du loader

document.addEventListener('DOMContentLoaded', () => {
    initLightbox();
    const loaderStartTime = Date.now();
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('project');

    if (!projectId) {
        window.location.href = '/';
        return;
    }

    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            // Chercher le projet dans tous les services
            let foundProject = null;
            for (const serviceKey in data.services) {
                const project = data.services[serviceKey].projects.find(p => p.id === projectId);
                if (project) {
                    foundProject = project;
                    break;
                }
            }

            if (foundProject) {
                renderProjectDetails(foundProject);
            } else {
                console.error('Projet non trouvé:', projectId);
                document.getElementById('project-name').innerText = 'Projet non trouvé';
            }

            // Calcul du temps restant pour atteindre la durée minimale
            const elapsed = Date.now() - loaderStartTime;
            const remaining = Math.max(0, LOADER_MIN_DURATION - elapsed);

            // On attend au moins la durée minimale avant de masquer le loader
            setTimeout(() => hideLoader(), remaining);
        })
        .catch(error => {
            console.error('Erreur lors du chargement des données:', error);
            hideLoader();
        });
});

function hideLoader() {
    const loader = document.getElementById('folio-loader');
    if (!loader) return;
    loader.classList.add('slide-out');
    // Supprimer du DOM après la transition (0.6s)
    loader.addEventListener('transitionend', () => loader.remove(), { once: true });
}

function renderProjectDetails(project) {
    document.getElementById('project-name').innerText = project.name;
    document.title = `${project.name} - PlanB services`;

    const grid = document.getElementById('media-grid');
    grid.innerHTML = '';

    if (project.media && project.media.length > 0) {
        project.media.forEach(mediaUrl => {
            const item = createMediaItem(mediaUrl);
            grid.appendChild(item);
        });
    } else if (project.thumbnail) {
        // Fallback sur le thumbnail si pas de liste de médias
        grid.appendChild(createMediaItem(project.thumbnail));
    }
}

function createMediaItem(url) {
    const div = document.createElement('div');
    div.className = 'grid-item';

    const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes('video/upload');

    if (isVideo) {
        div.innerHTML = `
            <video playsinline autoplay muted loop>
                <source src="${url}" type="video/mp4">
            </video>
        `;
    } else {
        div.innerHTML = `<img src="${url}" alt="Project media" loading="lazy">`;
    }

    div.addEventListener('click', () => {
        openLightbox(url, isVideo);
    });

    return div;
}

// --- Lightbox Logic ---
function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const closeBtn = document.querySelector('.lightbox-close');
    
    // Fermer avec le bouton X
    closeBtn.addEventListener('click', closeLightbox);
    
    // Fermer en cliquant en dehors du média
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target.classList.contains('lightbox-content-wrapper')) {
            closeLightbox();
        }
    });

    // Fermer avec la touche Echap
    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape" && lightbox.classList.contains('active')) {
            closeLightbox();
        }
    });
}

function openLightbox(url, isVideo) {
    const lightbox = document.getElementById('lightbox');
    const imgElement = document.getElementById('lightbox-img');
    const videoElement = document.getElementById('lightbox-video');

    if (isVideo) {
        imgElement.style.display = 'none';
        videoElement.src = url;
        videoElement.style.display = 'block';
        videoElement.play();
    } else {
        videoElement.style.display = 'none';
        videoElement.pause();
        videoElement.src = ''; // Clear video source
        imgElement.src = url;
        imgElement.style.display = 'block';
    }

    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden'; // Empêcher le scroll de la page
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    const videoElement = document.getElementById('lightbox-video');
    
    lightbox.classList.remove('active');
    document.body.style.overflow = ''; // Réactiver le scroll
    
    if (videoElement) {
        videoElement.pause();
    }
}
