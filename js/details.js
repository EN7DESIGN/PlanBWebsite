document.addEventListener('DOMContentLoaded', () => {
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
        })
        .catch(error => console.error('Erreur lors du chargement des données:', error));
});

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
            <video playsinline autoplay muted loop controls>
                <source src="${url}" type="video/mp4">
            </video>
        `;
    } else {
        div.innerHTML = `<img src="${url}" alt="Project media" loading="lazy">`;
    }

    return div;
}
