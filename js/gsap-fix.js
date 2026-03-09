window.addEventListener('load', function () {
    // 1. Rafraîchissement initial après stabilisation du DOM
    setTimeout(() => {
        if (window.ScrollTrigger) {
            ScrollTrigger.refresh();
        }
    }, 1000);

    // 2. Rafraîchissement intelligent lors du scroll inversé
    let lastScrollTop = 0;
    window.addEventListener('scroll', function () {
        let st = window.pageYOffset || document.documentElement.scrollTop;
        if (st < lastScrollTop && st > 0) {
            // L'utilisateur remonte
        }
        lastScrollTop = st <= 0 ? 0 : st;
    }, { passive: true });

    // 3. LA SOLUTION MIRACLE : Rafraîchir lors de l'entrée dans une section Sticky
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && window.ScrollTrigger) {
                ScrollTrigger.refresh();
            }
        });
    }, { threshold: [0, 0.5, 1] });

    // On cible toutes les sections
    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });
});
