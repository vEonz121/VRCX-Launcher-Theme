<template>
    <section
        class="vl-bottomdock"
        :class="{ 'is-open': open, 'is-resizing': resizing }"
        :style="{ '--dock-h': `${open ? height : 0}px` }">
        <div
            v-show="open"
            class="vl-bottomdock__handle"
            role="separator"
            aria-orientation="horizontal"
            title="Drag to resize · double-click to reset"
            @pointerdown="startResize"
            @dblclick="$emit('update:height', defaultHeight)"></div>

        <div class="vl-bottomdock__bar">
            <button
                type="button"
                class="vl-bottomdock__toggle"
                :title="open ? 'Hide panel' : 'Show panel'"
                @click="$emit('update:open', !open)">
                <ChevronUp class="size-4 transition-transform duration-300" :class="{ 'rotate-180': open }" />
            </button>
            <div class="vl-bottomdock__tabs" role="tablist">
                <button
                    v-for="tab in tabs"
                    :key="tab.key"
                    type="button"
                    role="tab"
                    class="vl-dtab"
                    :class="{ 'is-active': open && tab.key === active }"
                    :aria-selected="open && tab.key === active"
                    @click="selectTab(tab.key)">
                    <component :is="tab.icon" v-if="tab.icon" class="size-3.5" />
                    {{ tab.label }}
                    <i v-if="tab.badge" class="vl-dtab__badge"></i>
                </button>
            </div>
            <div class="vl-bottomdock__extra">
                <slot name="extra"></slot>
            </div>
        </div>

        <div class="vl-bottomdock__body">
            <Transition name="vl-page-fade" mode="out-in">
                <div v-if="open" :key="active" class="vl-bottomdock__content" :style="{ height: `${height}px` }">
                    <slot :tab="active"></slot>
                </div>
            </Transition>
        </div>
    </section>
</template>

<script setup>
    import { onBeforeUnmount, ref } from 'vue';
    import { ChevronUp } from 'lucide-vue-next';

    const props = defineProps({
        tabs: { type: Array, required: true },
        active: { type: String, default: '' },
        open: { type: Boolean, default: false },
        height: { type: Number, default: 300 },
        min: { type: Number, default: 160 },
        defaultHeight: { type: Number, default: 300 }
    });
    const emit = defineEmits(['update:open', 'update:active', 'update:height']);

    /** Clicking the open tab closes the dock; any other tab opens/switches */
    function selectTab(key) {
        if (props.open && key === props.active) {
            emit('update:open', false);
            return;
        }
        emit('update:active', key);
        if (!props.open) emit('update:open', true);
    }

    const resizing = ref(false);
    let startY = 0;
    let startH = 0;
    function clampHeight(h) {
        const max = Math.round(window.innerHeight * 0.7);
        return Math.round(Math.min(max, Math.max(props.min, h)));
    }
    function onMove(e) {
        emit('update:height', clampHeight(startH + (startY - e.clientY)));
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
        startY = e.clientY;
        startH = props.height;
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', stop);
    }
    onBeforeUnmount(stop);
</script>
