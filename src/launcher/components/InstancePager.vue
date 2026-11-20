<template>
    <div
        ref="rootRef"
        class="vl-pager"
        :style="{ '--cols': fitCols, '--rows': fitRows }"
        @wheel="onWheel"
        @pointerdown="onPointerDown">
        <div v-if="!cards.length" class="vl-pager__empty">
            <slot name="empty"></slot>
        </div>

        <template v-else>
            <div ref="viewportRef" class="vl-pager__viewport">
                <div
                    class="vl-pager__track"
                    :class="{ 'is-dragging': dragging }"
                    :style="{ transform: `translateX(calc(${-page * 100}% + ${dragOffset}px))` }">
                    <section
                        v-for="(pageCards, p) in pages"
                        :key="p"
                        class="vl-page"
                        :class="{ 'is-active': p === page }"
                        :aria-hidden="p !== page">
                        <div class="vl-page__grid">
                            <InstanceCard
                                v-for="(card, i) in pageCards"
                                :key="card.id"
                                :card="card"
                                :index="i"
                                :focused="card.id === focusedId"
                                :busy="card.id === busyId"
                                :join-mode="joinMode"
                                @focus="$emit('focus', $event)"
                                @join="(c, m) => $emit('join', c, m)"
                                @self-invite="$emit('self-invite', $event)"
                                @open-world="$emit('open-world', $event)"
                                @open-user="$emit('open-user', $event)"
                                @launch-dialog="$emit('launch-dialog', $event)"
                                @request-invite="$emit('request-invite', $event)" />
                        </div>
                    </section>
                </div>
            </div>

            <button
                v-show="page > 0"
                type="button"
                class="vl-pager__arrow vl-pager__arrow--left"
                aria-label="Previous page"
                @click="go(page - 1)">
                <ChevronLeft class="size-7" />
            </button>
            <button
                v-show="page < pages.length - 1"
                type="button"
                class="vl-pager__arrow vl-pager__arrow--right"
                aria-label="Next page"
                @click="go(page + 1)">
                <ChevronRight class="size-7" />
            </button>

            <div class="vl-pager__dots">
                <button
                    v-for="(_, p) in pages"
                    :key="p"
                    type="button"
                    class="vl-dot"
                    :class="{ 'is-active': p === page }"
                    :aria-label="`Page ${p + 1}`"
                    @click="go(p)"></button>
                <span class="vl-pager__pagenum">{{ page + 1 }} / {{ pages.length }}</span>
            </div>
        </template>
    </div>
</template>

<script setup>
    import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
    import { ChevronLeft, ChevronRight } from 'lucide-vue-next';

    import InstanceCard from './InstanceCard.vue';

    const props = defineProps({
        cards: { type: Array, default: () => [] },
        columns: { type: Number, default: 5 },
        rows: { type: Number, default: 4 },
        joinMode: { type: String, default: 'vr' },
        busyId: { type: String, default: '' },
        focusedId: { type: String, default: '' },
        /** Cards never shrink below this; rows/columns drop instead (e.g. when side panels open) */
        minCardWidth: { type: Number, default: 210 },
        minCardHeight: { type: Number, default: 150 }
    });

    const emit = defineEmits([
        'join',
        'self-invite',
        'open-world',
        'open-user',
        'launch-dialog',
        'focus',
        'page-change',
        'request-invite'
    ]);

    const rootRef = ref(null);
    const viewportRef = ref(null);
    const page = ref(0);

    // ── fit the grid to the space available ──
    const box = ref({ w: 0, h: 0 });
    const GAP = 14;
    const fitCols = computed(() => {
        if (!box.value.w) return props.columns;
        const fit = Math.floor((box.value.w + GAP) / (props.minCardWidth + GAP));
        return Math.max(1, Math.min(props.columns, fit));
    });
    const fitRows = computed(() => {
        if (!box.value.h) return props.rows;
        const fit = Math.floor((box.value.h + GAP) / (props.minCardHeight + GAP));
        return Math.max(1, Math.min(props.rows, fit));
    });
    let ro = null;
    function measureBox() {
        const el = viewportRef.value;
        if (!el) return;
        box.value = { w: el.clientWidth - 20, h: el.clientHeight - 20 };
    }
    watch(viewportRef, (el, old) => {
        if (old) ro?.unobserve(old);
        if (el) {
            ro ??= new ResizeObserver(measureBox);
            ro.observe(el);
            measureBox();
        }
    });
    // keep roughly the same cards on screen when the page size changes
    const perPage = computed(() => Math.max(1, fitCols.value * fitRows.value));
    watch(perPage, (now, before) => {
        if (before && now !== before) page.value = Math.floor((page.value * before) / now);
    });

    const pages = computed(() => {
        const out = [];
        for (let i = 0; i < props.cards.length; i += perPage.value) {
            out.push(props.cards.slice(i, i + perPage.value));
        }
        return out;
    });

    watch(
        () => pages.value.length,
        (len) => {
            if (page.value > len - 1) page.value = Math.max(0, len - 1);
        }
    );

    watch(page, (p) => emit('page-change', p, pages.value[p] || []), { immediate: true });
    watch(pages, () => emit('page-change', page.value, pages.value[page.value] || []));

    function go(p) {
        page.value = Math.min(Math.max(0, p), Math.max(0, pages.value.length - 1));
    }

    // ── wheel paging (vertical or horizontal), one page per gesture ──
    let wheelLock = 0;
    function onWheel(e) {
        if (e.target.closest?.('[role="menu"]')) return;
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        if (Math.abs(delta) < 12) return;
        const now = Date.now();
        if (now < wheelLock) return;
        wheelLock = now + 550;
        go(page.value + (delta > 0 ? 1 : -1));
    }

    // ── drag / swipe ──
    const dragging = ref(false);
    const dragOffset = ref(0);
    let startX = 0;
    let pointerId = null;
    let moved = false;

    function onPointerDown(e) {
        if (e.button !== 0) return;
        if (e.target.closest('button, a, input, [role="menu"]')) return;
        startX = e.clientX;
        pointerId = e.pointerId;
        moved = false;
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp, { once: true });
    }
    function onPointerMove(e) {
        if (e.pointerId !== pointerId) return;
        const dx = e.clientX - startX;
        if (!moved && Math.abs(dx) < 8) return;
        moved = true;
        dragging.value = true;
        const atEdge = (page.value === 0 && dx > 0) || (page.value === pages.value.length - 1 && dx < 0);
        dragOffset.value = atEdge ? dx * 0.25 : dx;
    }
    function onPointerUp() {
        window.removeEventListener('pointermove', onPointerMove);
        const width = rootRef.value?.clientWidth || 1000;
        const dx = dragOffset.value;
        dragging.value = false;
        dragOffset.value = 0;
        if (moved) {
            // swallow the click that follows a drag
            window.addEventListener('click', (ev) => ev.stopPropagation(), { capture: true, once: true });
            if (Math.abs(dx) > width * 0.12) go(page.value + (dx < 0 ? 1 : -1));
        }
    }

    // ── keyboard ──
    function onKey(e) {
        const tag = (e.target?.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;
        if (document.querySelector('[role="dialog"][data-state="open"]')) return;
        if (!rootRef.value || rootRef.value.offsetParent === null) return; // not visible (kept-alive)
        if (e.key === 'ArrowRight' || e.key === 'PageDown') {
            go(page.value + 1);
            e.preventDefault();
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
            go(page.value - 1);
            e.preventDefault();
        } else if (e.key === 'Home') {
            go(0);
        } else if (e.key === 'End') {
            go(pages.value.length - 1);
        }
    }

    onMounted(() => window.addEventListener('keydown', onKey));
    onBeforeUnmount(() => {
        ro?.disconnect();
        window.removeEventListener('keydown', onKey);
        window.removeEventListener('pointermove', onPointerMove);
    });

    defineExpose({ go, page });
</script>
