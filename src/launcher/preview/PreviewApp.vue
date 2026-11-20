<template>
    <div id="x-app" class="flex w-screen h-screen overflow-hidden">
        <div class="vl-root">
            <AnimatedBackground :focus-image="focusImage" />
            <div class="vl-shell">
                <LauncherTopBar
                    :tabs="tabs"
                    :active-tab="activeTab"
                    :active-route="route"
                    :user="mockUser"
                    @select-tab="selectTab"
                    @navigate="(p) => go(p.route)"
                    @open-profile="toast('Opens your VRCX profile dialog')">
                    <template #actions>
                        <button
                            type="button"
                            class="vl-iconbtn vl-iconbtn--lg"
                            title="Search (Ctrl+K)"
                            @click="toast('Opens VRCX quick search')">
                            <Search class="size-4.5" />
                        </button>
                        <button
                            type="button"
                            class="vl-iconbtn vl-iconbtn--lg"
                            title="Direct access"
                            @click="toast('Opens Direct Access')">
                            <Compass class="size-4.5" />
                        </button>
                        <button
                            type="button"
                            class="vl-iconbtn vl-iconbtn--lg"
                            title="Notifications"
                            @click="toast('Opens the notification center')">
                            <Bell class="size-4.5" />
                            <i class="vl-badge-dot"></i>
                        </button>
                        <button
                            type="button"
                            class="vl-iconbtn vl-iconbtn--lg"
                            :class="{ 'is-active': theme.sidebarOpen }"
                            title="Friends sidebar"
                            @click="theme.sidebarOpen = !theme.sidebarOpen">
                            <PanelRight class="size-4.5" />
                        </button>
                    </template>
                </LauncherTopBar>

                <div class="vl-body">
                    <div class="vl-main">
                        <main class="vl-stage" :class="{ 'is-native': route !== 'home' && route !== 'launcher-theme' }">
                            <Transition :name="transition" mode="out-in">
                                <HomeScreen
                                    v-if="route === 'home'"
                                    key="home"
                                    :cards="cards"
                                    :stats="stats"
                                    :user-name="mockUser.name"
                                    :refreshing="refreshing"
                                    :last-updated="lastUpdated"
                                    :busy-id="busyId"
                                    :game-running="false"
                                    @refresh="refresh"
                                    @join="join"
                                    @self-invite="(c) => toast(`Invite to ${c.worldName} sent to yourself`)"
                                    @open-world="(c) => toast(`Opens world details: ${c.worldName}`)"
                                    @open-user="(id) => toast(`Opens user dialog for ${id}`)"
                                    @launch-dialog="(c) => toast(`Opens launch dialog for ${c.worldName}`)"
                                    @request-invite="(c) => toast(`Asked ${c.friends[0].name} for an invite`)" />
                                <ThemeStudio v-else-if="route === 'launcher-theme'" key="theme" />
                                <PreviewLogs v-else-if="route === 'friend-log'" key="flog" kind="friend" />
                                <PreviewLogs v-else-if="route === 'game-log'" key="glog" kind="game" />
                                <div v-else :key="route" class="x-container pv-placeholder">
                                    <div class="vl-empty__orb"><LayoutGrid class="size-7" /></div>
                                    <h2>{{ currentLabel }}</h2>
                                    <p>
                                        In VRCX this page is the original <b>{{ currentLabel }}</b> view with all its
                                        features, restyled to match the launcher. It needs a logged-in VRCX, so the
                                        browser preview shows this placeholder.
                                    </p>
                                </div>
                            </Transition>
                        </main>

                        <BottomDock
                            v-model:open="theme.dockOpen"
                            v-model:active="theme.dockTab"
                            v-model:height="theme.dockHeight"
                            :tabs="dockTabs">
                            <template #default="{ tab }">
                                <div class="vl-dockview">
                                    <PreviewLogs v-if="tab === 'game-log'" kind="game" />
                                    <PreviewLogs v-else-if="tab === 'friend-log'" kind="friend" />
                                    <div v-else class="pv-dockempty">
                                        In VRCX this shows the full
                                        <b>{{ dockTabs.find((d) => d.key === tab)?.label }}</b> view.
                                    </div>
                                </div>
                            </template>
                        </BottomDock>
                    </div>

                    <SideDock v-model:width="theme.sidebarWidth" :open="theme.sidebarOpen" :default-width="340">
                        <div class="pv-drawer vl-scroll">
                            <h3>Friends · {{ allFriends.length }} online</h3>
                            <div v-for="f in allFriends" :key="f.id" class="pv-friend">
                                <span class="vl-avatar" style="margin: 0"
                                    ><img :src="f.image" alt="" /><i
                                        class="vl-avatar__dot"
                                        :class="`is-${f.status}`"></i
                                ></span>
                                <div>
                                    <b>{{ f.name }}</b>
                                    <small>{{ f.world }}</small>
                                </div>
                            </div>
                        </div>
                    </SideDock>
                </div>

                <div class="vl-statusbar">
                    <div class="pv-status">
                        <span><i class="vl-livedot"></i> VRChat API: OK</span>
                        <span>Friends online: {{ stats.online }}</span>
                        <span>Game: not running</span>
                        <span class="ml-auto opacity-60">Browser preview · mock data</span>
                    </div>
                </div>
            </div>
        </div>
        <Toaster position="top-center" theme="dark" rich-colors />
    </div>
</template>

<script setup>
    import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
    import {
        Bell,
        Compass,
        LayoutGrid,
        MessageSquare,
        PanelRight,
        Radio,
        ScrollText,
        Search,
        Shield,
        UserRoundPlus,
        Users
    } from 'lucide-vue-next';
    import { toast as sonner } from 'vue-sonner';

    import { Toaster } from '@/components/ui/sonner';
    import AnimatedBackground from '../components/AnimatedBackground.vue';
    import BottomDock from '../components/BottomDock.vue';
    import SideDock from '../components/SideDock.vue';
    import HomeScreen from '../components/HomeScreen.vue';
    import LauncherTopBar from '../components/LauncherTopBar.vue';
    import ThemeStudio from '../components/ThemeStudio.vue';
    import PreviewLogs from './PreviewLogs.vue';
    import { findTabForRoute, launcherTabs } from '../navigation';
    import { focusImage } from '../state';
    import { applyCssVariables, launcherTheme as theme } from '../theme/useLauncherTheme';
    import { buildMockCards, mockUser } from './mockData';

    const toast = (msg) => sonner(msg);

    document.documentElement.classList.add('vl-launcher', 'dark');
    applyCssVariables();

    const tabs = launcherTabs;
    const route = ref('home');
    const activeTab = computed(() => findTabForRoute(launcherTabs, route.value));
    const currentLabel = computed(() => {
        for (const t of launcherTabs) for (const p of t.pages) if (p.route === route.value) return p.label;
        return route.value;
    });
    const lastPage = new Map();
    const transition = ref('vl-page-fade');

    function go(name) {
        const a = launcherTabs.findIndex((t) => t.key === activeTab.value);
        const b = launcherTabs.findIndex((t) => t.key === findTabForRoute(launcherTabs, name));
        transition.value = a === b ? 'vl-page-fade' : b > a ? 'vl-page-left' : 'vl-page-right';
        route.value = name;
        lastPage.set(launcherTabs[b].key, name);
    }
    function selectTab(tab) {
        go(lastPage.get(tab.key) || tab.pages[0].route);
    }

    // ── mock instances with simulated live updates ──
    const cards = ref(buildMockCards());
    focusImage.value = cards.value[0].image;
    const lastUpdated = ref(Date.now());
    const refreshing = ref(false);
    const busyId = ref('');
    const dockTabs = [
        { key: 'game-log', label: 'Game Log', icon: ScrollText },
        { key: 'feed', label: 'Feed', icon: Radio },
        { key: 'notification', label: 'Notifications', icon: MessageSquare, badge: true },
        { key: 'friend-log', label: 'Friend Log', icon: UserRoundPlus },
        { key: 'player-list', label: 'Players Here', icon: Users },
        { key: 'moderation', label: 'Moderation', icon: Shield }
    ];

    const stats = computed(() => ({
        instances: cards.value.length,
        friendsInGame: cards.value.reduce((n, c) => n + c.friendCount, 0),
        online: cards.value.reduce((n, c) => n + c.friendCount, 0) + 9
    }));

    const allFriends = computed(() =>
        cards.value
            .flatMap((c) => c.friends.map((f) => ({ ...f, world: c.worldName })))
            .sort((a, b) => a.name.localeCompare(b.name))
    );

    function refresh() {
        refreshing.value = true;
        setTimeout(() => {
            cards.value = cards.value.map((c) => ({
                ...c,
                userCount: Math.max(
                    c.friendCount,
                    Math.min(c.capacity, c.userCount + Math.round((Math.random() - 0.5) * 6))
                )
            }));
            lastUpdated.value = Date.now();
            refreshing.value = false;
        }, 700);
    }

    // a friend hops between instances every few seconds, like the real websocket feed
    function hop() {
        const list = cards.value.map((c) => ({ ...c, friends: [...c.friends] }));
        const from = list.filter((c) => c.friends.length > 1)[Math.floor(Math.random() * 10)];
        const to = list[Math.floor(Math.random() * list.length)];
        if (!from || from === to) return;
        const f = from.friends.pop();
        to.friends.unshift(f);
        from.friendCount = from.friends.length;
        to.friendCount = to.friends.length;
        cards.value = list;
    }

    let hopTimer = null;
    let refreshTimer = null;
    onMounted(() => {
        hopTimer = setInterval(hop, 6000);
        refreshTimer = setInterval(refresh, 60000);
    });
    onBeforeUnmount(() => {
        clearInterval(hopTimer);
        clearInterval(refreshTimer);
    });

    function join(card, mode) {
        busyId.value = card.id;
        setTimeout(() => {
            busyId.value = '';
            sonner.success(`Launching VRChat${mode === 'desktop' ? ' (desktop)' : ' in VR'} → ${card.worldName}`);
        }, 900);
    }
</script>

<style>
    .pv-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        gap: 12px;
    }
    .pv-placeholder h2 {
        font-size: 22px;
        font-weight: 750;
    }
    .pv-placeholder p {
        max-width: 460px;
        opacity: 0.7;
        font-size: 13.5px;
        line-height: 1.5;
    }
    .pv-status {
        display: flex;
        align-items: center;
        gap: 18px;
        height: 24px;
        padding: 0 12px;
        font-size: 11.5px;
    }
    .pv-status span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }
    .pv-drawer {
        padding: 14px;
        height: 100%;
    }
    .pv-dockempty {
        height: 100%;
        display: grid;
        place-items: center;
        opacity: 0.6;
        font-size: 13px;
    }
    .pv-drawer h3 {
        font-size: 12px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        opacity: 0.6;
        margin-bottom: 10px;
    }
    .pv-friend {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 7px 8px;
        border-radius: 12px;
    }
    .pv-friend:hover {
        background: oklch(1 0 0 / 0.07);
    }
    .pv-friend b {
        display: block;
        font-size: 13px;
    }
    .pv-friend small {
        font-size: 11px;
        opacity: 0.6;
    }
</style>
