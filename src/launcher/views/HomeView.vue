<template>
    <HomeScreen
        :cards="cards"
        :stats="stats"
        :user-name="currentUser?.displayName || ''"
        :refreshing="refreshing"
        :loading="!friendsLoaded"
        :last-updated="lastUpdated"
        :busy-id="busyId"
        :game-running="isGameRunning"
        @refresh="refresh({ force: true })"
        @page-change="setVisible"
        @join="join"
        @self-invite="selfInvite"
        @open-world="(c) => showWorldDialog(c.location, c.shortName)"
        @open-user="showUserDialog"
        @launch-dialog="(c) => launchStore.showLaunchDialog(c.location, c.shortName)"
        @request-invite="requestInvite" />
</template>

<script setup>
    import { computed, ref, watch } from 'vue';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';

    import { instanceRequest, notificationRequest } from '../../api';
    import { parseLocation } from '../../shared/utils';
    import { showUserDialog } from '../../coordinators/userCoordinator';
    import { showWorldDialog } from '../../coordinators/worldCoordinator';
    import { useFriendStore, useGameStore, useLaunchStore, useUserStore } from '../../stores';
    import { focusImage } from '../state';
    import { useInstanceCards } from '../composables/useInstanceCards';

    import HomeScreen from '../components/HomeScreen.vue';

    defineOptions({ name: 'LauncherHome' });

    const launchStore = useLaunchStore();
    const { isGameRunning } = storeToRefs(useGameStore());
    const { currentUser } = storeToRefs(useUserStore());
    const friendStore = useFriendStore();

    const { cards, stats, refresh, refreshing, lastUpdated, setVisible } = useInstanceCards();

    const friendsLoaded = computed(() => (friendStore.friends?.size ?? 0) > 0);

    watch(
        cards,
        (list) => {
            if (!focusImage.value && list.length) focusImage.value = list[0].image || list[0].thumbnail || '';
        },
        { immediate: true }
    );

    const busyId = ref('');

    /**
     * Join button. If VRChat is already running we hand the instance to the
     * running game (same as VRCX's "open in VRChat"); otherwise we start the
     * game straight into the instance, in VR unless desktop was chosen.
     */
    async function join(card, mode = 'vr') {
        if (busyId.value) return;
        busyId.value = card.id;
        try {
            if (isGameRunning.value) {
                await launchStore.tryOpenInstanceInVrc(card.location, card.shortName);
                toast.success(`Joining ${card.worldName || 'instance'}…`);
            } else {
                await launchStore.launchGame(card.location, card.shortName, mode === 'desktop');
            }
        } catch (e) {
            console.error(e);
            toast.error('Could not launch VRChat');
        } finally {
            setTimeout(() => (busyId.value = ''), 1500);
        }
    }

    async function selfInvite(card) {
        try {
            const L = parseLocation(card.location);
            await instanceRequest.selfInvite({
                worldId: L.worldId,
                instanceId: L.instanceId,
                shortName: card.shortName
            });
            toast.success('Invite sent to yourself');
        } catch (e) {
            console.error(e);
        }
    }

    async function requestInvite(card) {
        const target = card.friends[0];
        if (!target) return;
        try {
            await notificationRequest.sendRequestInvite({ platform: 'standalonewindows' }, target.id);
            toast.success(`Asked ${target.name} for an invite`);
        } catch (e) {
            console.error(e);
        }
    }
</script>
