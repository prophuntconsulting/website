(function initFeatureCardBorderGlow() {
    'use strict';

    const cards = document.querySelectorAll('.feature-card');
    if (!cards.length) return;

    const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    cards.forEach((card) => {
        card.classList.add('border-glow-card');

        const edgeLight = document.createElement('span');
        edgeLight.className = 'edge-light';
        edgeLight.setAttribute('aria-hidden', 'true');
        card.appendChild(edgeLight);

        if (!supportsHover) return;

        card.addEventListener('pointermove', (event) => {
            card.classList.add('glow-active');

            const rect = card.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const deltaX = x - centerX;
            const deltaY = y - centerY;

            const scaleX = deltaX === 0 ? Infinity : centerX / Math.abs(deltaX);
            const scaleY = deltaY === 0 ? Infinity : centerY / Math.abs(deltaY);
            const proximity = Math.min(Math.max(1 / Math.min(scaleX, scaleY), 0), 1);
            const angle = (Math.atan2(deltaY, deltaX) * 180 / Math.PI + 450) % 360;

            card.style.setProperty('--edge-proximity', (proximity * 100).toFixed(3));
            card.style.setProperty('--cursor-angle', `${angle.toFixed(3)}deg`);
        }, { passive: true });

        card.addEventListener('pointerleave', () => {
            card.classList.remove('glow-active');
            card.style.setProperty('--edge-proximity', '0');
        }, { passive: true });
    });
})();
