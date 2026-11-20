<template>
    <template v-if="watchState.isLoggedIn">
        <div class="vl-root">
            <AnimatedBackground :focus-image="focusImage" />

            <div class="vl-shell">
                <LauncherTopBar
                    :tabs="tabs"
                    :active-tab="activeTab"
                    :active-route="String(route.name || '')"
                    :active-params="route.params"
                    :user="me"
                    @select-tab="selectTab"
                    @navigate="navigate"
                    @open-profile="me && showUserDialog(me.id)">
                    <template #actions>
                        <button
                            type="button"
                            class="vl-iconbtn vl-iconbtn--lg"
                            title="Search (Ctrl+K)"
                            @click="quickSearchStore.open()">
                            <Search class="size-4.5" />
                        </button>
                        <button
                            type="button"
                            class="vl-iconbtn vl-iconbtn--lg"
                            :title="t('prompt.direct_access_omni.header')"
                            @click="searchStore.directAccessPaste()">
                            <Compass class="size-4.5" />
                        </button>
                        <button
                            type="button"
                            class="vl-iconbtn vl-iconbtn--lg"
                            title="Notifications"
                            @click="isNotificationCenterOpen = !isNotificationCenterOpen">
                            <Bell class="size-4.5" />
                            <i v-if="hasUnseenNotifications" class="vl-badge-dot"></i>
                        </button>
                        <button
                            type="button"
                            class="vl-iconbtn vl-iconbtn--lg"
                            :class="{ 'is-active': theme.sidebarOpen }"
                            :title="theme.sidebarOpen ? 'Hide friends sidebar' : 'Show friends sidebar'"
                            @click="theme.sidebarOpen = !theme.sidebarOpen">
                            <PanelRight class="size-4.5" />
                        </button>
                    </template>
                </LauncherTopBar>

                <div class="vl-body">
                    <div class="vl-main">
                        <main
                            class="vl-stage"
                            :class="{ 'is-home': route.name === 'home', 'is-native': isNativeRoute }">
                            <RouterView v-slot="{ Component }">
                                <Transition :name="transitionName" mode="out-in">
                                    <KeepAlive exclude="ChartsInstance, ChartsMutual">
                                        <component :is="Component" />
                                    </KeepAlive>
                                </Transition>
                            </RouterView>
                        </main>

                        <BottomDock
                            v-model:open="theme.dockOpen"
                            v-model:active="theme.dockTab"
                            v-model:height="theme.dockHeight"
                            :tabs="dockTabs"
                            :default-height="300">
                            <template #default="{ tab }">
                                <div class="vl-dockview">
                                    <component :is="panelComponentMap[tab]" v-if="panelComponentMap[tab]" />
                                </div>
                            </template>
                            <template #extra>
                                <button
                                    v-if="theme.dockOpen"
                                    type="button"
                                    class="vl-dtab"
                                    title="Open as a full page"
                                    @click="navigate({ route: theme.dockTab })">
                                    <Maximize2 class="size-3.5" />
                                </button>
                            </template>
                        </BottomDock>
                    </div>

                    <!-- the original VRCX friends sidebar, docked and resizable -->
                    <SideDock v-model:width="theme.sidebarWidth" :open="theme.sidebarOpen" :default-width="340">
                        <Sidebar />
                    </SideDock>
                </div>

                <div class="vl-statusbar">
                    <StatusBar />
                </div>
            </div>
        </div>

        <!-- ## Dialogs (same set as the classic layout) ## -->
        <MainDialogContainer />
        <InviteGroupDialog />
        <GroupEditDialog />
        <GroupEventEditDialog />
        <FullscreenImagePreview />
        <LaunchDialog />
        <LaunchOptionsDialog />
        <FriendImportDialog />
        <WorldImportDialog />
        <AvatarImportDialog />
        <ChooseFavoriteGroupDialog />
        <VRChatConfigDialog />
        <PrimaryPasswordDialog />
        <SendBoopDialog />
        <InventoryBundleDialog />
        <FreeStoreItemDialog />
        <ModerationReportDialog />
        <GlobalToolsDialogs />
        <ChangelogDialog />
        <WhatsNewDialog />
        <SpotlightDialog />
    </template>
</template>

<script setup>
    import { computed, onBeforeUnmount, ref, watch } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';
    import { useRoute, useRouter } from 'vue-router';
    import {
        Bell,
        Compass,
        Maximize2,
        MessageSquare,
        PanelRight,
        Radio,
        ScrollText,
        Search,
        Shield,
        UserRoundPlus,
        Users
    } from 'lucide-vue-next';

    import {
        useDashboardStore,
        useNotificationStore,
        useQuickSearchStore,
        useSearchStore,
        useUserStore
    } from '../stores';
    import { showUserDialog } from '../coordinators/userCoordinator';
    import { useUserDisplay } from '../composables/useUserDisplay';
    import { watchState } from '../services/watchState';
    import { findTabForRoute, launcherTabs } from './navigation';
    import { focusImage } from './state';
    import { launcherTheme as theme } from './theme/useLauncherTheme';
    import { panelComponentMap } from '../views/Dashboard/components/panelRegistry';
    import { statusKey } from './composables/instanceCardUtils';
    import { useLauncherShellClass } from './theme/useLauncherShellClass';

    import AnimatedBackground from './components/AnimatedBackground.vue';
    import BottomDock from './components/BottomDock.vue';
    import LauncherTopBar from './components/LauncherTopBar.vue';
    import SideDock from './components/SideDock.vue';

    import AvatarImportDialog from '../views/Favorites/dialogs/AvatarImportDialog.vue';
    import ChangelogDialog from '../views/Settings/dialogs/ChangelogDialog.vue';
    import ChooseFavoriteGroupDialog from '../components/dialogs/ChooseFavoriteGroupDialog.vue';
    import FreeStoreItemDialog from '../components/dialogs/FreeStoreItemDialog.vue';
    import FriendImportDialog from '../views/Favorites/dialogs/FriendImportDialog.vue';
    import FullscreenImagePreview from '../components/FullscreenImagePreview.vue';
    import GlobalToolsDialogs from '../views/Tools/components/GlobalToolsDialogs.vue';
    import GroupEditDialog from '../components/dialogs/GroupDialog/GroupEditDialog.vue';
    import GroupEventEditDialog from '../components/dialogs/GroupDialog/GroupEventEditDialog.vue';
    import InventoryBundleDialog from '../components/dialogs/InventoryBundleDialog.vue';
    import InviteGroupDialog from '../components/dialogs/InviteGroupDialog.vue';
    import LaunchDialog from '../components/dialogs/LaunchDialog.vue';
    import LaunchOptionsDialog from '../views/Settings/dialogs/LaunchOptionsDialog.vue';
    import MainDialogContainer from '../components/dialogs/MainDialogContainer.vue';
    import ModerationReportDialog from '../components/dialogs/ModerationReportDialog.vue';
    import PrimaryPasswordDialog from '../views/Settings/dialogs/PrimaryPasswordDialog.vue';
    import SendBoopDialog from '../components/dialogs/SendBoopDialog.vue';
    import Sidebar from '../views/Sidebar/Sidebar.vue';
    import StatusBar from '../components/StatusBar.vue';
    import VRChatConfigDialog from '../views/Settings/dialogs/VRChatConfigDialog.vue';
    import WorldImportDialog from '../views/Favorites/dialogs/WorldImportDialog.vue';
    import WhatsNewDialog from '../components/onboarding/WhatsNewDialog.vue';
    import SpotlightDialog from '../components/onboarding/SpotlightDialog.vue';

    const { t, te } = useI18n();
    const route = useRoute();
    const router = useRouter();

    useLauncherShellClass();

    const quickSearchStore = useQuickSearchStore();
    const searchStore = useSearchStore();
    const notificationStore = useNotificationStore();
    const { isNotificationCenterOpen, hasUnseenNotifications } = storeToRefs(notificationStore);
    const { currentUser } = storeToRefs(useUserStore());
    const dashboardStore = useDashboardStore();
    const { userImage } = useUserDisplay();

    const me = computed(() => {
        const u = currentUser.value;
        if (!u?.id) return null;
        return { id: u.id, name: u.displayName, image: userImage(u, true), status: statusKey(u.status) };
    });

    const label = (p) => (p.labelKey && te(p.labelKey) ? t(p.labelKey) : p.label);

    const tabs = computed(() =>
        launcherTabs.map((tab) => {
            const pages = tab.pages.map((p) => ({ ...p, label: label(p) }));
            if (tab.key === 'insights') {
                for (const d of dashboardStore.dashboards || []) {
                    pages.push({ route: 'dashboard', params: { id: d.id }, label: d.name || 'Dashboard' });
                }
            }
            return {
                ...tab,
                pages,
                badge: tab.key === 'logs' && hasUnseenNotifications.value ? '•' : ''
            };
        })
    );

    /** Last visited page per tab, so clicking a tab returns you where you were */
    const lastPageByTab = new Map();

    const activeTab = computed(() => {
        if (route.name === 'dashboard') return 'insights';
        return findTabForRoute(launcherTabs, route.name) || '';
    });

    const isNativeRoute = computed(() => !['home', 'launcher-theme'].includes(String(route.name)));

    function navigate(p) {
        if (p.params) router.push({ name: p.route, params: p.params });
        else router.push({ name: p.route });
    }

    function selectTab(tab) {
        const remembered = lastPageByTab.get(tab.key);
        navigate(remembered || tab.pages[0]);
    }

    // ── direction-aware page transitions ──
    const transitionName = ref('vl-page-fade');
    const tabIndex = (key) => launcherTabs.findIndex((tb) => tb.key === key);
    watch(
        () => [route.name, route.params?.id],
        (_, old) => {
            const tabKey = activeTab.value;
            if (tabKey) {
                const page = tabs.value
                    .find((tb) => tb.key === tabKey)
                    ?.pages.find((p) => p.route === route.name && (!p.params || p.params.id === route.params?.id));
                if (page) lastPageByTab.set(tabKey, page);
            }
            if (!old) return;
            const prevTab = route.name === 'dashboard' ? 'insights' : findTabForRoute(launcherTabs, old[0]);
            const a = tabIndex(prevTab);
            const b = tabIndex(tabKey);
            if (a === -1 || b === -1 || a === b) transitionName.value = 'vl-page-fade';
            else transitionName.value = b > a ? 'vl-page-left' : 'vl-page-right';
        },
        { immediate: true }
    );

    // ── bottom dock ──
    const dockTabs = computed(() => [
        { key: 'game-log', label: label({ label: 'Game Log', labelKey: 'nav_tooltip.game_log' }), icon: ScrollText },
        { key: 'feed', label: label({ label: 'Feed', labelKey: 'nav_tooltip.feed' }), icon: Radio },
        {
            key: 'notification',
            label: label({ label: 'Notifications', labelKey: 'nav_tooltip.notification' }),
            icon: MessageSquare,
            badge: hasUnseenNotifications.value
        },
        {
            key: 'friend-log',
            label: label({ label: 'Friend Log', labelKey: 'nav_tooltip.friend_log' }),
            icon: UserRoundPlus
        },
        {
            key: 'player-list',
            label: label({ label: 'Players Here', labelKey: 'nav_tooltip.player_list' }),
            icon: Users
        },
        { key: 'moderation', label: label({ label: 'Moderation', labelKey: 'nav_tooltip.moderation' }), icon: Shield }
    ]);
    if (!dockTabs.value.some((tb) => tb.key === theme.dockTab)) theme.dockTab = 'game-log';

    // tell the stores which views are on screen in the dock so their data keeps loading
    watch(
        () => [theme.dockOpen, theme.dockTab],
        ([open, tab]) => {
            dashboardStore.setDockedPanels(open ? [tab] : []);
        },
        { immediate: true }
    );
    onBeforeUnmount(() => {
        dashboardStore.setDockedPanels([]);
    });

    watch(
        () => watchState.isLoggedIn,
        (isLoggedIn) => {
            if (!isLoggedIn) router.replace({ name: 'login' });
        },
        { immediate: true }
    );
</script>
