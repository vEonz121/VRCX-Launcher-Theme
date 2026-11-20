<template>
    <div class="x-container pv-logs">
        <div class="pv-logs__bar">
            <label class="vl-search">
                <Search class="size-4 opacity-60" />
                <input v-model="q" type="text" :placeholder="`Search ${kind === 'friend' ? 'friend' : 'game'} log…`" />
            </label>
            <div class="vl-seg">
                <button
                    v-for="f in filters"
                    :key="f"
                    type="button"
                    class="vl-seg__btn"
                    :class="{ 'is-active': filter === f }"
                    @click="filter = f">
                    {{ f }}
                </button>
            </div>
        </div>
        <div class="pv-logs__table vl-scroll">
            <div class="pv-row pv-row--head">
                <span>Time</span><span>Type</span><span>{{ kind === 'friend' ? 'User' : 'Detail' }}</span
                ><span></span>
            </div>
            <TransitionGroup name="pv-list">
                <div v-for="row in rows" :key="row.id" class="pv-row">
                    <span class="pv-time" :title="row.time.toLocaleString()">{{ rel(row.time) }}</span>
                    <span
                        ><i class="pv-type" :class="`is-${row.type}`">{{ pretty(row.type) }}</i></span
                    >
                    <span class="pv-who">
                        <img :src="row.image" alt="" />
                        <b>{{ row.name }}</b>
                        <em v-if="row.detail">{{ row.detail }}</em>
                    </span>
                    <span class="pv-act"><ChevronRight class="size-4 opacity-40" /></span>
                </div>
            </TransitionGroup>
        </div>
        <p class="pv-note">
            Preview data. In VRCX this tab shows the original {{ kind === 'friend' ? 'Friend Log' : 'Game Log' }} with
            every filter, search, sessions view and export, restyled in glass.
        </p>
    </div>
</template>

<script setup>
    import { computed, ref, watch } from 'vue';
    import { ChevronRight, Search } from 'lucide-vue-next';

    import { buildFriendLog, buildGameLog } from './mockData';

    const props = defineProps({ kind: { type: String, default: 'friend' } });

    const data = { friend: buildFriendLog(), game: buildGameLog() };
    const q = ref('');
    const filter = ref('All');
    watch(
        () => props.kind,
        () => (filter.value = 'All')
    );

    const filters = computed(() =>
        props.kind === 'friend'
            ? ['All', 'Friend', 'Unfriend', 'DisplayName', 'TrustLevel']
            : ['All', 'Location', 'OnPlayerJoined', 'OnPlayerLeft', 'VideoPlay']
    );

    const rows = computed(() =>
        data[props.kind].filter(
            (r) =>
                (filter.value === 'All' || r.type === filter.value) &&
                (!q.value || `${r.name} ${r.detail}`.toLowerCase().includes(q.value.toLowerCase()))
        )
    );

    const pretty = (t) =>
        ({
            OnPlayerJoined: 'Joined',
            OnPlayerLeft: 'Left',
            DisplayName: 'Name change',
            TrustLevel: 'Trust',
            FriendRequest: 'Request',
            VideoPlay: 'Video',
            PortalSpawn: 'Portal'
        })[t] || t;

    function rel(d) {
        const m = Math.round((Date.now() - d) / 60000);
        if (m < 60) return `${m}m ago`;
        const h = Math.round(m / 60);
        if (h < 24) return `${h}h ago`;
        return `${Math.round(h / 24)}d ago`;
    }
</script>

<style scoped>
    .pv-logs {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    .pv-logs__bar {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
    }
    .pv-logs__table {
        flex: 1;
        min-height: 0;
        border-radius: 14px;
    }
    .pv-row {
        display: grid;
        grid-template-columns: 110px 130px 1fr 30px;
        align-items: center;
        gap: 10px;
        padding: 9px 12px;
        border-radius: 12px;
        font-size: 13px;
        transition: background 160ms;
    }
    .pv-row:not(.pv-row--head):hover {
        background: oklch(1 0 0 / 0.07);
    }
    .pv-row--head {
        position: sticky;
        top: 0;
        z-index: 1;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        opacity: 0.6;
        background: oklch(0.2 0.03 var(--vl-hue) / 0.8);
        backdrop-filter: blur(12px);
    }
    .pv-time {
        opacity: 0.65;
        font-variant-numeric: tabular-nums;
    }
    .pv-type {
        font-style: normal;
        font-size: 11px;
        font-weight: 700;
        padding: 3px 9px;
        border-radius: 999px;
        background: oklch(1 0 0 / 0.1);
    }
    .pv-type.is-Friend,
    .pv-type.is-OnPlayerJoined {
        background: oklch(0.7 0.15 150 / 0.25);
        color: oklch(0.88 0.12 150);
    }
    .pv-type.is-Unfriend,
    .pv-type.is-OnPlayerLeft {
        background: oklch(0.65 0.18 25 / 0.25);
        color: oklch(0.85 0.12 25);
    }
    .pv-type.is-Location {
        background: var(--vl-accent-soft);
        color: #fff;
    }
    .pv-type.is-DisplayName,
    .pv-type.is-VideoPlay {
        background: oklch(0.7 0.15 300 / 0.25);
        color: oklch(0.88 0.1 300);
    }
    .pv-type.is-TrustLevel,
    .pv-type.is-PortalSpawn {
        background: oklch(0.75 0.15 80 / 0.25);
        color: oklch(0.9 0.12 80);
    }
    .pv-who {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
    }
    .pv-who img {
        width: 28px;
        height: 28px;
        border-radius: 9px;
        object-fit: cover;
        flex: none;
    }
    .pv-who b {
        font-weight: 650;
        white-space: nowrap;
    }
    .pv-who em {
        font-style: normal;
        opacity: 0.6;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .pv-note {
        font-size: 11.5px;
        opacity: 0.5;
    }
    .pv-list-enter-active,
    .pv-list-leave-active {
        transition: all 300ms var(--vl-ease);
    }
    .pv-list-enter-from,
    .pv-list-leave-to {
        opacity: 0;
        transform: translateX(-12px);
    }
    .pv-list-leave-active {
        position: absolute;
    }
</style>
