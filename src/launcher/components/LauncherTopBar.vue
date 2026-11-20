<template>
    <header class="vl-top">
        <div class="vl-top__row">
            <div class="vl-brand">
                <span class="vl-brand__mark">V</span>
                <span class="vl-brand__name">VRCX</span>
            </div>

            <nav ref="tabsRef" class="vl-tabs" role="tablist">
                <span class="vl-tabs__indicator" :style="indicatorStyle"></span>
                <button
                    v-for="tab in tabs"
                    :key="tab.key"
                    :ref="(el) => setTabRef(tab.key, el)"
                    type="button"
                    role="tab"
                    class="vl-tab"
                    :class="{ 'is-active': tab.key === activeTab }"
                    :aria-selected="tab.key === activeTab"
                    @click="$emit('select-tab', tab)">
                    <component :is="icons[tab.icon] || Circle" class="size-4" />
                    <span class="vl-tab__label">{{ tab.label }}</span>
                    <span v-if="tab.badge" class="vl-tab__badge">{{ tab.badge }}</span>
                </button>
            </nav>

            <div class="vl-top__right">
                <slot name="actions"></slot>
                <div class="vl-clock" :title="dateLabel">
                    <span class="vl-clock__time">{{ timeLabel }}</span>
                    <span class="vl-clock__date">{{ shortDate }}</span>
                </div>
                <button v-if="user" type="button" class="vl-me" :title="user.name" @click="$emit('open-profile')">
                    <img v-if="user.image" :src="user.image" alt="" />
                    <span v-else>{{ (user.name || '?').slice(0, 1) }}</span>
                    <i class="vl-avatar__dot" :class="`is-${user.status || 'active'}`"></i>
                </button>
            </div>
        </div>

        <Transition name="vl-subnav">
            <div v-if="currentTab && currentTab.pages.length > 1" :key="currentTab.key" class="vl-subnav">
                <button
                    v-for="p in currentTab.pages"
                    :key="p.route + (p.params?.id || '')"
                    type="button"
                    class="vl-subtab"
                    :class="{ 'is-active': isPageActive(p) }"
                    @click="$emit('navigate', p)">
                    {{ p.label }}
                </button>
            </div>
        </Transition>
    </header>
</template>

<script setup>
    import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
    import { ChartPie, Circle, Compass, House, Palette, ScrollText, Settings, Users, Wrench } from 'lucide-vue-next';

    import { launcherTheme } from '../theme/useLauncherTheme';

    const icons = { ChartPie, Compass, House, Palette, ScrollText, Settings, Users, Wrench };

    const props = defineProps({
        tabs: { type: Array, required: true },
        activeTab: { type: String, default: '' },
        activeRoute: { type: String, default: '' },
        activeParams: { type: Object, default: () => ({}) },
        user: { type: Object, default: null }
    });

    defineEmits(['select-tab', 'navigate', 'open-profile']);

    const currentTab = computed(() => props.tabs.find((t) => t.key === props.activeTab));

    function isPageActive(p) {
        if (p.route !== props.activeRoute) return false;
        if (p.params?.id) return p.params.id === props.activeParams?.id;
        return true;
    }

    // ── sliding indicator ──
    const tabsRef = ref(null);
    const tabEls = new Map();
    const indicator = ref({ left: 0, width: 0, visible: false });
    function setTabRef(key, el) {
        if (el) tabEls.set(key, el);
        else tabEls.delete(key);
    }
    function measure() {
        const el = tabEls.get(props.activeTab);
        if (!el) {
            indicator.value = { ...indicator.value, visible: false };
            return;
        }
        indicator.value = { left: el.offsetLeft, width: el.offsetWidth, visible: true };
    }
    const indicatorStyle = computed(() => ({
        transform: `translateX(${indicator.value.left}px)`,
        width: `${indicator.value.width}px`,
        opacity: indicator.value.visible ? 1 : 0
    }));
    watch(
        () => [props.activeTab, props.tabs.length],
        () => nextTick(measure)
    );

    // ── clock ──
    const now = ref(new Date());
    let clockTimer = null;
    const timeLabel = computed(() =>
        now.value.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: !launcherTheme.clock24h
        })
    );
    const shortDate = computed(() =>
        now.value.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })
    );
    const dateLabel = computed(() => now.value.toLocaleDateString([], { dateStyle: 'full' }));

    let ro = null;
    onMounted(() => {
        nextTick(measure);
        clockTimer = setInterval(() => (now.value = new Date()), 10_000);
        ro = new ResizeObserver(measure);
        if (tabsRef.value) ro.observe(tabsRef.value);
        document.fonts?.ready?.then(measure);
    });
    onBeforeUnmount(() => {
        clearInterval(clockTimer);
        ro?.disconnect();
    });
</script>
