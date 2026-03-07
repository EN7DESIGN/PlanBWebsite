window.addEventListener('load', function () {

    // 1. Rafraîchissement initial après stabilisation du DOM
    setTimeout(() => {
        if (window.ScrollTrigger) {
            ScrollTrigger.refresh();
        }
    }, 1000);

    // 2. Rafraîchissement intelligent lors du scroll inversé
    // On détecte quand l'utilisateur remonte pour recalculer si besoin
    let lastScrollTop = 0;
    window.addEventListener('scroll', function () {
        let st = window.pageYOffset || document.documentElement.scrollTop;
        if (st < lastScrollTop && st > 0) {
            // L'utilisateur remonte : on peut forcer un refresh léger 
            // uniquement si on détecte une anomalie ou après un certain seuil
        }
        lastScrollTop = st <= 0 ? 0 : st;
    }, { passive: true });

    // 3. LA SOLUTION MIRACLE : Rafraîchir lors de l'entrée dans une section Sticky
    // On utilise l'Intersection Observer (très léger) pour refresh GSAP
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && window.ScrollTrigger) {
                ScrollTrigger.refresh();
            }
        });
    }, { threshold: [0, 0.5, 1] });

    // On cible toutes tes sections (change .section par ta classe de section)
    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });
});
