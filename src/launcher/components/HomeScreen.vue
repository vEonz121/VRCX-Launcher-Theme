<template>
    <div class="vl-home">
        <div class="vl-home__head">
            <div class="vl-home__title">
                <h1>{{ greeting }}</h1>
                <p>
                    <span class="vl-chip"><i class="vl-livedot"></i>{{ stats.online }} online</span>
                    <span class="vl-chip">{{ stats.friendsInGame }} in instances</span>
                    <span class="vl-chip"
                        >{{ stats.instances }} {{ stats.instances === 1 ? 'instance' : 'instances' }}</span
                    >
                    <span v-if="gameRunning" class="vl-chip vl-chip--accent">VRChat running</span>
                </p>
            </div>

            <div class="vl-home__tools">
                <label class="vl-search">
                    <Search class="size-4 opacity-60" />
                    <input v-model="query" type="text" placeholder="Filter worlds or friends…" spellcheck="false" />
                    <button v-if="query" type="button" class="vl-search__clear" @click="query = ''">
                        <X class="size-3.5" />
                    </button>
                </label>

                <div class="vl-seg" role="radiogroup" aria-label="Sort">
                    <button
                        v-for="s in sorts"
                        :key="s.id"
                        type="button"
                        class="vl-seg__btn"
                        :class="{ 'is-active': theme.sortBy === s.id }"
                        @click="theme.sortBy = s.id">
                        {{ s.label }}
                    </button>
                </div>

                <div class="vl-seg" role="radiogroup" aria-label="Join mode" title="What the Join button launches">
                    <button
                        type="button"
                        class="vl-seg__btn"
                        :class="{ 'is-active': theme.joinMode === 'vr' }"
                        @click="theme.joinMode = 'vr'">
                        <Glasses class="size-4" /> VR
                    </button>
                    <button
                        type="button"
                        class="vl-seg__btn"
                        :class="{ 'is-active': theme.joinMode === 'desktop' }"
                        @click="theme.joinMode = 'desktop'">
                        <Monitor class="size-4" /> Desktop
                    </button>
                </div>

                <button
                    type="button"
                    class="vl-btn vl-btn--glass"
                    :title="`Updated ${updatedAgo}`"
                    @click="$emit('refresh')">
                    <RefreshCw class="size-4" :class="{ 'animate-spin': refreshing }" />
                    <span>{{ updatedAgo }}</span>
                </button>
            </div>
        </div>

        <InstancePager
            :cards="filteredCards"
            :columns="Number(theme.gridColumns) || 5"
            :rows="Number(theme.gridRows) || 4"
            :join-mode="theme.joinMode"
            :busy-id="busyId"
            :focused-id="focusedId"
            @focus="onFocus"
            @page-change="(p, onPage) => $emit('page-change', onPage)"
            @join="(c, m) => $emit('join', c, m || theme.joinMode)"
            @self-invite="$emit('self-invite', $event)"
            @open-world="$emit('open-world', $event)"
            @open-user="$emit('open-user', $event)"
            @launch-dialog="$emit('launch-dialog', $event)"
            @request-invite="$emit('request-invite', $event)">
            <template #empty>
                <div class="vl-empty">
                    <div class="vl-empty__orb"><Sparkles class="size-8" /></div>
                    <h2 v-if="query">No instances match “{{ query }}”</h2>
                    <h2 v-else-if="loading">Finding your friends…</h2>
                    <h2 v-else>No friends in joinable instances right now</h2>
                    <p v-if="!query">Cards appear here live as friends hop into worlds.</p>
                </div>
            </template>
        </InstancePager>
    </div>
</template>

<script setup>
    import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
    import { Glasses, Monitor, RefreshCw, Search, Sparkles, X } from 'lucide-vue-next';

    import { launcherTheme as theme } from '../theme/useLauncherTheme';
    import { focusImage } from '../state';
    import InstancePager from './InstancePager.vue';

    const props = defineProps({
        cards: { type: Array, default: () => [] },
        stats: { type: Object, default: () => ({ online: 0, friendsInGame: 0, instances: 0 }) },
        userName: { type: String, default: '' },
        refreshing: { type: Boolean, default: false },
        loading: { type: Boolean, default: false },
        lastUpdated: { type: Number, default: () => Date.now() },
        busyId: { type: String, default: '' },
        gameRunning: { type: Boolean, default: false }
    });

    defineEmits([
        'refresh',
        'join',
        'self-invite',
        'open-world',
        'open-user',
        'launch-dialog',
        'request-invite',
        'page-change'
    ]);

    const sorts = [
        { id: 'friends', label: 'Friends' },
        { id: 'players', label: 'Players' },
        { id: 'name', label: 'A–Z' }
    ];

    const query = ref('');
    const filteredCards = computed(() => {
        const q = query.value.trim().toLowerCase();
        if (!q) return props.cards;
        return props.cards.filter(
            (c) =>
                (c.worldName || '').toLowerCase().includes(q) ||
                c.friends.some((f) => (f.name || '').toLowerCase().includes(q))
        );
    });

    const focusedId = ref('');
    function onFocus(card) {
        focusedId.value = card.id;
        if (card.image || card.thumbnail) focusImage.value = card.image || card.thumbnail;
    }

    const now = ref(Date.now());
    let tick = null;
    onMounted(() => (tick = setInterval(() => (now.value = Date.now()), 5000)));
    onBeforeUnmount(() => clearInterval(tick));

    const updatedAgo = computed(() => {
        const s = Math.max(0, Math.round((now.value - props.lastUpdated) / 1000));
        if (s < 10) return 'Just now';
        if (s < 60) return `${s}s ago`;
        return `${Math.round(s / 60)}m ago`;
    });

    const greeting = computed(() => {
        const h = new Date(now.value).getHours();
        const part = h < 5 ? 'Late night' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
        return props.userName ? `${part}, ${props.userName}` : part;
    });
</script>
