<template>
    <aside
        class="vl-sidedock"
        :class="{ 'is-open': open, 'is-resizing': resizing }"
        :style="{ '--dock-w': `${open ? width : 0}px` }"
        :aria-hidden="!open">
        <div
            class="vl-sidedock__handle"
            role="separator"
            aria-orientation="vertical"
            title="Drag to resize · double-click to reset"
            @pointerdown="startResize"
            @dblclick="$emit('update:width', defaultWidth)"></div>
        <div class="vl-sidedock__inner" :style="{ width: `${width}px` }">
            <slot></slot>
        </div>
    </aside>
</template>

<script setup>
    import { onBeforeUnmount, ref } from 'vue';

    const props = defineProps({
        open: { type: Boolean, default: true },
        width: { type: Number, default: 340 },
        min: { type: Number, default: 240 },
        max: { type: Number, default: 640 },
        defaultWidth: { type: Number, default: 340 }
    });
    const emit = defineEmits(['update:width']);

    const resizing = ref(false);
    let startX = 0;
    let startW = 0;

    function clampWidth(w) {
        const hardMax = Math.min(props.max, Math.round(window.innerWidth * 0.6));
        return Math.round(Math.min(hardMax, Math.max(props.min, w)));
    }

    function onMove(e) {
        // panel sits on the right, so dragging left makes it wider
        emit('update:width', clampWidth(startW + (startX - e.clientX)));
    }
    function stop() {
        resizing.value = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', stop);
    }
    function startResize(e) {
        if (e.button !== 0) return;
        e.preventDefault();
        resizing.value = true;
        startX = e.clientX;
        startW = props.width;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', stop);
    }
    onBeforeUnmount(stop);
</script>
