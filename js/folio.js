document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const serviceId = urlParams.get('service') || 'crea'; // 'crea' par défaut

    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            const service = data.services[serviceId];
            if (service) {
                updateFolioPage(service);
            } else {
                console.error('Service non trouvé:', serviceId);
                // Optionnel: rediriger vers une page 404 ou afficher un message
            }
        })
        .catch(error => console.error('Erreur lors du chargement des données:', error));
});

function updateFolioPage(service) {
    // Mise à jour des textes
    document.getElementById('folio-title').innerHTML = service.title;
    document.getElementById('folio-description').innerHTML = service.description;

    // Mise à jour des images header
    const headerImg = document.getElementById('folio-header-img');
    const headerImgMobile = document.getElementById('folio-header-img-mobile');

    if (headerImg) {
        headerImg.src = service.headerImage;
        headerImg.removeAttribute('srcset');
        headerImg.removeAttribute('sizes');
    }
    if (headerImgMobile) {
        headerImgMobile.src = service.headerImageMobile;
        headerImgMobile.removeAttribute('srcset');
        headerImgMobile.removeAttribute('sizes');
    }

    // Mise à jour de la liste des projets
    const container = document.getElementById('projects-container');
    container.innerHTML = ''; // Vider le conteneur

    if (service.projects && service.projects.length > 0) {
        service.projects.forEach(project => {
            const card = createProjectCard(project);
            container.appendChild(card);
        });
    } else {
        container.innerHTML = '<p class="folio-header_text">Aucun projet disponible pour ce service pour le moment.</p>';
    }
}

function createProjectCard(project) {
    const div = document.createElement('div');
    div.className = 'folio_card';
    div.innerHTML = `
        <a href="details.html?project=${project.id}" class="w-inline-block" style="text-decoration: none; color: inherit; width: 100%;">
            <div class="folio_card-imgbloc" style="background-image: url('${project.thumbnail}'); background-size: cover; background-position: center;"></div>
            <p class="folio_card-title"><strong>${project.name}</strong></p>
        </a>
    `;
    return div;
}
