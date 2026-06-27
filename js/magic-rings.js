(() => {
    const mount = document.getElementById('magicRings');
    const canvas = document.getElementById('magicRingsCanvas');
    if (!mount || !canvas) return;

    const context = canvas.getContext('2d', { alpha: true });
    if (!context) {
        mount.hidden = true;
        return;
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const colors = ['#e14747', '#e65743', '#ed6c40', '#f5853f', '#ff9f43'];
    let width = 0;
    let height = 0;
    let frameId = null;
    let visible = true;
    let lastTime = 0;

    function resize() {
        const bounds = mount.getBoundingClientRect();
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        width = Math.max(1, bounds.width);
        height = Math.max(1, bounds.height);
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        draw(lastTime || 0);
    }

    function drawRing(radius, index, phase) {
        const pulse = 0.56 + Math.sin(phase * Math.PI * 2 + index * 0.8) * 0.18;
        const cutaway = 0.22 + index * 0.035;
        const rotation = phase * 0.2 + index * 0.08;

        context.save();
        context.translate(width / 2, height / 2);
        context.rotate(rotation);
        context.scale(0.92, 1);
        context.strokeStyle = colors[index % colors.length];
        context.globalAlpha = Math.max(0.16, pulse - index * 0.035);
        context.lineWidth = index === 0 ? 2.4 : 1.7;
        context.shadowColor = colors[index % colors.length];
        context.shadowBlur = 18 + index * 3;
        context.lineCap = 'round';

        context.beginPath();
        context.arc(0, 0, radius, -Math.PI / 2 + cutaway, Math.PI / 2 - cutaway);
        context.stroke();

        context.beginPath();
        context.arc(0, 0, radius, Math.PI / 2 + cutaway, Math.PI * 1.5 - cutaway);
        context.stroke();
        context.restore();
    }

    function draw(time) {
        lastTime = time;
        context.clearRect(0, 0, width, height);
        const base = Math.min(width, height) * 0.23;
        const spacing = Math.min(width, height) * 0.075;
        const phase = reduceMotion.matches ? 0.22 : (time * 0.00012) % 1;

        for (let index = 0; index < 5; index += 1) {
            const expansion = reduceMotion.matches ? 0 : Math.sin(phase * Math.PI * 2 + index) * 5;
            drawRing(base + spacing * index + expansion, index, phase);
        }
    }

    function animate(time) {
        frameId = null;
        if (!visible || document.hidden || reduceMotion.matches) return;
        draw(time);
        frameId = requestAnimationFrame(animate);
    }

    function updateAnimation() {
        if (reduceMotion.matches) {
            if (frameId) cancelAnimationFrame(frameId);
            frameId = null;
            draw(0);
            return;
        }
        if (visible && !document.hidden && !frameId) frameId = requestAnimationFrame(animate);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);

    const visibilityObserver = new IntersectionObserver(entries => {
        visible = entries[0]?.isIntersecting ?? false;
        updateAnimation();
    }, { rootMargin: '150px' });
    visibilityObserver.observe(mount);

    reduceMotion.addEventListener('change', updateAnimation);
    document.addEventListener('visibilitychange', updateAnimation);
    resize();
    updateAnimation();
})();
