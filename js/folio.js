const LOADER_MIN_DURATION = 1800; // ms — durée minimale d'affichage du loader

document.addEventListener('DOMContentLoaded', () => {
    const loaderStartTime = Date.now();
    const urlParams = new URLSearchParams(window.location.search);
    const serviceId = urlParams.get('service') || 'crea';

    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            const service = data.services[serviceId];
            if (service) {
                updateFolioPage(service);
            } else {
                console.error('Service non trouvé:', serviceId);
            }

            // Attendre la durée minimale avant de cacher le loader
            const elapsed = Date.now() - loaderStartTime;
            const remaining = Math.max(0, LOADER_MIN_DURATION - elapsed);

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

function updateFolioPage(service) {
    document.getElementById('folio-title').innerHTML = service.title;
    document.getElementById('folio-description').innerHTML = service.description;

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

    const container = document.getElementById('projects-container');
    container.innerHTML = '';

    if (service.projects && service.projects.length > 0) {
        service.projects.forEach(project => {
            container.appendChild(createProjectCard(project));
        });
    } else {
        container.innerHTML = `
            <div class="folio_card">
                <div class="folio_card-imgbloc"></div>
                <p class="Folio-Card_Contexte">Hello, Jambo !</p>
                <p class="Folio-Card_Title">Nous n'avons pas encore ajouté de projets ici pour l'instant</p>
            </div>
        `;
    }
}

function createProjectCard(project) {
    const div = document.createElement('div');
    div.className = 'folio_card';
    div.innerHTML = `
        <a href="details.html?project=${project.id}" class="w-inline-block" style="text-decoration: none; color: inherit; width: 100%;">
            <div class="folio_card-imgbloc" style="background-image: url('${project.thumbnail}'); background-size: cover; background-position: center;"></div>
            <p class="Folio-Card_Contexte">${project.context || 'Projet'}</p>
            <p class="Folio-Card_Title">${project.name}</p>
        </a>
    `;
    return div;
}
