<template>
    <div class="vl-bg" :class="`vl-bg--${mode}`" aria-hidden="true">
        <div class="vl-bg__base"></div>

        <template v-if="mode === 'aurora'">
            <div class="vl-bg__blob vl-bg__blob--1"></div>
            <div class="vl-bg__blob vl-bg__blob--2"></div>
            <div class="vl-bg__blob vl-bg__blob--3"></div>
            <div class="vl-bg__blob vl-bg__blob--4"></div>
        </template>

        <div v-else-if="mode === 'mesh'" class="vl-bg__mesh"></div>

        <TransitionGroup
            v-else-if="mode === 'world' || mode === 'image'"
            name="vl-bgfade"
            tag="div"
            class="vl-bg__images">
            <div
                v-for="img in imageLayers"
                :key="img"
                class="vl-bg__image"
                :style="{ backgroundImage: `url(&quot;${img}&quot;)` }"></div>
        </TransitionGroup>

        <canvas v-if="usesCanvas" ref="canvasRef" class="vl-bg__canvas"></canvas>

        <div class="vl-bg__tint"></div>
        <div class="vl-bg__vignette"></div>
        <div class="vl-bg__grain"></div>
    </div>
</template>

<script setup>
    import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

    import { launcherTheme as theme } from '../theme/useLauncherTheme';

    const props = defineProps({
        /** Image used by the "world" background mode (focused card) */
        focusImage: { type: String, default: '' }
    });

    const mode = computed(() => theme.background || 'xmb');
    const usesCanvas = computed(() => mode.value === 'xmb' || mode.value === 'bokeh');

    const imageLayers = computed(() => {
        const src = mode.value === 'image' ? theme.imageUrl : props.focusImage;
        return src ? [src] : [];
    });

    const canvasRef = ref(null);
    let raf = 0;
    let running = false;
    let lastFrame = 0;
    let t0 = performance.now();
    let bokeh = [];

    function resize() {
        const c = canvasRef.value;
        if (!c) return;
        // render at reduced resolution: it is blurred/soft anyway and keeps GPU use low while in VR
        const scale = 0.5;
        c.width = Math.max(1, Math.floor(c.clientWidth * scale));
        c.height = Math.max(1, Math.floor(c.clientHeight * scale));
        if (mode.value === 'bokeh') seedBokeh(c);
    }

    function seedBokeh(c) {
        const count = 34;
        bokeh = Array.from({ length: count }, () => ({
            x: Math.random() * c.width,
            y: Math.random() * c.height,
            r: 6 + Math.random() * 38,
            vx: (Math.random() - 0.5) * 0.25,
            vy: -0.1 - Math.random() * 0.35,
            a: 0.08 + Math.random() * 0.22,
            hueShift: (Math.random() - 0.5) * 60
        }));
    }

    function drawXmb(ctx, w, h, t) {
        ctx.clearRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'lighter';
        const hue = Number(theme.hue) || 0;
        const ribbons = 7;
        for (let i = 0; i < ribbons; i++) {
            const phase = i * 0.7;
            const amp = h * (0.06 + i * 0.012);
            const freq = 1.4 + i * 0.18;
            const yBase = h * 0.58 + Math.sin(t * 0.00012 + i) * h * 0.04;
            ctx.beginPath();
            for (let x = 0; x <= w; x += 6) {
                const nx = x / w;
                const y =
                    yBase +
                    Math.sin(nx * Math.PI * freq + t * 0.00045 * (1 + i * 0.08) + phase) * amp +
                    Math.sin(nx * Math.PI * 3.1 - t * 0.0003 + phase * 2) * amp * 0.35;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            const alpha = 0.05 + (i / ribbons) * 0.09;
            ctx.strokeStyle = `hsla(${hue + i * 4}, 90%, 82%, ${alpha})`;
            ctx.lineWidth = 1 + (i % 3);
            ctx.shadowColor = `hsla(${hue}, 100%, 75%, 0.6)`;
            ctx.shadowBlur = 12;
            ctx.stroke();
        }
        // a soft wide band under the lines, like the PS3 menu wave
        const grad = ctx.createLinearGradient(0, h * 0.4, 0, h);
        grad.addColorStop(0, `hsla(${hue}, 80%, 70%, 0)`);
        grad.addColorStop(0.5, `hsla(${hue}, 80%, 70%, 0.05)`);
        grad.addColorStop(1, `hsla(${hue}, 80%, 70%, 0)`);
        ctx.shadowBlur = 0;
        ctx.fillStyle = grad;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 8) {
            const nx = x / w;
            const y = h * 0.6 + Math.sin(nx * Math.PI * 1.6 + t * 0.00035) * h * 0.08;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }

    function drawBokeh(ctx, w, h, dt) {
        ctx.clearRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'lighter';
        const hue = Number(theme.hue) || 0;
        const speed = dt / 16;
        for (const p of bokeh) {
            p.x += p.vx * speed;
            p.y += p.vy * speed;
            if (p.y < -p.r) {
                p.y = h + p.r;
                p.x = Math.random() * w;
            }
            if (p.x < -p.r) p.x = w + p.r;
            if (p.x > w + p.r) p.x = -p.r;
            const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
            g.addColorStop(0, `hsla(${hue + p.hueShift}, 90%, 78%, ${p.a})`);
            g.addColorStop(0.7, `hsla(${hue + p.hueShift}, 90%, 70%, ${p.a * 0.4})`);
            g.addColorStop(1, `hsla(${hue + p.hueShift}, 90%, 70%, 0)`);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
    }

    let simTime = 0;
    function frame(now) {
        if (!running) return;
        raf = requestAnimationFrame(frame);
        // ~30 fps cap
        if (now - lastFrame < 33) return;
        const dt = Math.min(100, now - lastFrame);
        lastFrame = now;
        const c = canvasRef.value;
        if (!c) return;
        const ctx = c.getContext('2d');
        if (!ctx) return;
        const motion = Number(theme.motion) || 0;
        simTime += dt * motion;
        if (mode.value === 'xmb') drawXmb(ctx, c.width, c.height, simTime + t0);
        else if (mode.value === 'bokeh') drawBokeh(ctx, c.width, c.height, dt * motion);
    }

    function start() {
        stop();
        if (!usesCanvas.value) return;
        requestAnimationFrame(() => {
            resize();
            running = true;
            lastFrame = performance.now() - 40;
            raf = requestAnimationFrame(frame);
        });
    }

    function stop() {
        running = false;
        cancelAnimationFrame(raf);
    }

    function onVisibility() {
        if (document.hidden) stop();
        else start();
    }

    watch(mode, start);

    onMounted(() => {
        start();
        window.addEventListener('resize', resize);
        document.addEventListener('visibilitychange', onVisibility);
    });

    onBeforeUnmount(() => {
        stop();
        window.removeEventListener('resize', resize);
        document.removeEventListener('visibilitychange', onVisibility);
    });
</script>

<style scoped>
    .vl-bg {
        position: fixed;
        inset: 0;
        z-index: 0;
        overflow: hidden;
        pointer-events: none;
        --speed: calc(1 / max(var(--vl-motion, 1), 0.05));
    }
    .vl-bg__base {
        position: absolute;
        inset: 0;
        background:
            radial-gradient(120% 90% at 15% 0%, oklch(0.36 0.12 var(--vl-hue)) 0%, transparent 60%),
            radial-gradient(90% 80% at 100% 100%, oklch(0.3 0.1 calc(var(--vl-hue) + 40)) 0%, transparent 65%),
            linear-gradient(160deg, oklch(0.2 0.05 var(--vl-hue)) 0%, oklch(0.12 0.03 calc(var(--vl-hue) + 20)) 100%);
    }
    .vl-bg__canvas {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        filter: blur(0.5px);
    }
    .vl-bg__blob {
        position: absolute;
        width: 60vmax;
        height: 60vmax;
        border-radius: 50%;
        filter: blur(90px);
        opacity: 0.55;
        mix-blend-mode: screen;
        animation: vl-drift calc(38s * var(--speed)) ease-in-out infinite alternate;
    }
    .vl-bg__blob--1 {
        background: oklch(0.6 0.2 var(--vl-hue));
        left: -15vmax;
        top: -20vmax;
    }
    .vl-bg__blob--2 {
        background: oklch(0.55 0.2 calc(var(--vl-hue) + 60));
        right: -20vmax;
        top: 10vmax;
        animation-duration: calc(46s * var(--speed));
        animation-direction: alternate-reverse;
    }
    .vl-bg__blob--3 {
        background: oklch(0.5 0.18 calc(var(--vl-hue) - 50));
        left: 20vmax;
        bottom: -30vmax;
        animation-duration: calc(52s * var(--speed));
    }
    .vl-bg__blob--4 {
        background: oklch(0.65 0.15 calc(var(--vl-hue) + 140));
        right: 10vmax;
        bottom: -10vmax;
        width: 35vmax;
        height: 35vmax;
        opacity: 0.3;
        animation-duration: calc(30s * var(--speed));
    }
    @keyframes vl-drift {
        0% {
            transform: translate(0, 0) scale(1);
        }
        50% {
            transform: translate(8vmax, 6vmax) scale(1.15);
        }
        100% {
            transform: translate(-6vmax, 10vmax) scale(0.9);
        }
    }
    .vl-bg__mesh {
        position: absolute;
        inset: -50%;
        background: conic-gradient(
            from 0deg,
            oklch(0.45 0.18 var(--vl-hue)),
            oklch(0.35 0.15 calc(var(--vl-hue) + 70)),
            oklch(0.25 0.1 calc(var(--vl-hue) + 150)),
            oklch(0.4 0.16 calc(var(--vl-hue) - 40)),
            oklch(0.45 0.18 var(--vl-hue))
        );
        filter: blur(110px) saturate(1.2);
        opacity: 0.75;
        animation: vl-spin calc(90s * var(--speed)) linear infinite;
    }
    @keyframes vl-spin {
        to {
            transform: rotate(360deg);
        }
    }
    .vl-bg__images {
        position: absolute;
        inset: 0;
    }
    .vl-bg__image {
        position: absolute;
        inset: -8%;
        background-size: cover;
        background-position: center;
        filter: blur(38px) saturate(1.3) brightness(0.6);
        animation: vl-kenburns calc(40s * var(--speed)) ease-in-out infinite alternate;
    }
    @keyframes vl-kenburns {
        from {
            transform: scale(1.05) translate(0, 0);
        }
        to {
            transform: scale(1.18) translate(-2%, -1%);
        }
    }
    .vl-bgfade-enter-active,
    .vl-bgfade-leave-active {
        transition: opacity 900ms ease;
    }
    .vl-bgfade-enter-from,
    .vl-bgfade-leave-to {
        opacity: 0;
    }
    .vl-bg__tint {
        position: absolute;
        inset: 0;
        background: oklch(0.25 0.12 var(--vl-hue));
        mix-blend-mode: soft-light;
        opacity: var(--vl-tint, 0.3);
    }
    .vl-bg__vignette {
        position: absolute;
        inset: 0;
        background: radial-gradient(130% 100% at 50% 40%, transparent 50%, oklch(0 0 0 / 0.55) 100%);
    }
    .vl-bg__grain {
        position: absolute;
        inset: 0;
        opacity: 0.06;
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
    }
    .vl-bg--solid .vl-bg__grain {
        opacity: 0.04;
    }
</style>
