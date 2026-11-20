import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';

import { instanceRequest, queryRequest } from '../../api';
import { isRealInstance } from '../../shared/utils/instance';
import { parseLocation, resolveRegion } from '../../shared/utils/location';
import { useFriendStore, useLocationStore, useWorldStore } from '../../stores';
import { useUserDisplay } from '../../composables/useUserDisplay';
import { launcherTheme } from '../theme/useLauncherTheme';
import { accessInfo, regionLabel, statusKey } from './instanceCardUtils';

/**
 * Groups online friends by the instance they are in and enriches each group
 * with world art and live player counts. Friend membership is fully reactive
 * (driven by VRCX's websocket updates); player counts are polled for the
 * cards that are on screen.
 */
export function useInstanceCards() {
    const friendStore = useFriendStore();
    const { vipFriends, onlineFriends } = storeToRefs(friendStore);
    const locationStore = useLocationStore();
    const { lastLocation } = storeToRefs(locationStore);
    const worldStore = useWorldStore();
    const { userImage } = useUserDisplay();

    /** WorldId → { name, thumbnail, image, capacity, loading, failed } */
    const worlds = reactive(new Map());
    /** Location tag → { userCount, capacity, fetchedAt, failed, shortName } */
    const instances = reactive(new Map());

    const lastUpdated = ref(Date.now());
    const refreshing = ref(false);
    const visibleIds = ref([]);

    function friendLocationTag(friend) {
        let tag = friend.ref?.$location?.tag || friend.ref?.location || '';
        if (!isRealInstance(tag) && lastLocation.value?.friendList?.has?.(friend.id)) {
            tag = lastLocation.value.location;
        }
        return isRealInstance(tag) ? tag : '';
    }

    const groups = computed(() => {
        const map = new Map();
        const all = [...(vipFriends.value || []), ...(onlineFriends.value || [])];
        for (const friend of all) {
            const tag = friendLocationTag(friend);
            if (!tag) continue;
            if (!map.has(tag)) map.set(tag, []);
            map.get(tag).push(friend);
        }
        const myTag = lastLocation.value?.location;
        if (myTag && isRealInstance(myTag) && !map.has(myTag)) {
            map.set(myTag, []);
        }
        return map;
    });

    function worldInfo(worldId) {
        const cached = worldStore.cachedWorlds.get(worldId);
        const local = worlds.get(worldId);
        if (cached?.name) {
            return {
                name: cached.name,
                thumbnail: cached.thumbnailImageUrl || cached.imageUrl || '',
                image: cached.imageUrl || cached.thumbnailImageUrl || '',
                capacity: cached.capacity,
                loading: false
            };
        }
        return local || { name: '', thumbnail: '', image: '', loading: true };
    }

    const cards = computed(() => {
        const myTag = lastLocation.value?.location;
        const list = [];
        for (const [tag, friends] of groups.value) {
            if (!launcherTheme.includeSolo && friends.length < 2 && tag !== myTag) continue;
            const L = parseLocation(tag);
            const w = worldInfo(L.worldId);
            const inst = instances.get(tag);
            const access = accessInfo(L.accessTypeName || L.accessType);
            list.push({
                id: tag,
                location: tag,
                worldId: L.worldId,
                instanceId: L.instanceId,
                shortName: inst?.shortName || L.shortName || '',
                worldName: w.name,
                thumbnail: w.thumbnail,
                image: w.image,
                loading: w.loading,
                accessKind: access.kind,
                accessLabel: access.label,
                joinable: access.joinable || tag === myTag,
                region: regionLabel(resolveRegion(L)),
                isOwnLocation: tag === myTag,
                userCount: inst && !inst.failed ? inst.userCount : null,
                capacity: (inst && inst.capacity) || w.capacity || null,
                friendCount: friends.length,
                friends: friends.map((f) => ({
                    id: f.id,
                    name: f.ref?.displayName || f.name,
                    image: userImage(f.ref, true),
                    status: statusKey(f.ref?.status),
                    isVIP: !!f.isVIP
                }))
            });
        }
        const sortBy = launcherTheme.sortBy;
        list.sort((a, b) => {
            if (a.isOwnLocation !== b.isOwnLocation) return a.isOwnLocation ? -1 : 1;
            if (sortBy === 'name') return (a.worldName || '').localeCompare(b.worldName || '');
            if (sortBy === 'players') return (b.userCount ?? -1) - (a.userCount ?? -1) || b.friendCount - a.friendCount;
            return b.friendCount - a.friendCount || (b.userCount ?? 0) - (a.userCount ?? 0);
        });
        return list;
    });

    // ── world details (names + art) ──
    const worldQueue = new Set();
    watch(
        () => [...groups.value.keys()].map((tag) => parseLocation(tag).worldId),
        (ids) => {
            for (const id of ids) {
                if (!id || worlds.has(id) || worldStore.cachedWorlds.get(id)?.name || worldQueue.has(id)) continue;
                worldQueue.add(id);
                worlds.set(id, { name: '', thumbnail: '', image: '', loading: true });
                queryRequest
                    .fetch('world.location', { worldId: id })
                    .then((args) => {
                        const r = args?.ref || args?.json || {};
                        worlds.set(id, {
                            name: r.name || '',
                            thumbnail: r.thumbnailImageUrl || r.imageUrl || '',
                            image: r.imageUrl || r.thumbnailImageUrl || '',
                            capacity: r.capacity,
                            loading: false
                        });
                    })
                    .catch(() => worlds.set(id, { name: '', thumbnail: '', image: '', loading: false, failed: true }))
                    .finally(() => worldQueue.delete(id));
            }
        },
        { immediate: true }
    );

    // ── live player counts, only for what is on screen ──
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    async function fetchInstance(tag) {
        const L = parseLocation(tag);
        if (!L.worldId || !L.instanceId) return;
        try {
            const { json } = await instanceRequest.getInstance({ worldId: L.worldId, instanceId: L.instanceId });
            instances.set(tag, {
                userCount: json?.n_users ?? json?.userCount ?? null,
                capacity: json?.capacity ?? null,
                shortName: json?.shortName || json?.secureName || '',
                fetchedAt: Date.now(),
                failed: false
            });
        } catch {
            instances.set(tag, { fetchedAt: Date.now(), failed: true });
        }
    }

    async function refresh({ force = false } = {}) {
        if (refreshing.value) return;
        refreshing.value = true;
        try {
            const maxAge = Math.max(15, Number(launcherTheme.refreshSeconds) || 60) * 1000;
            const now = Date.now();
            const targets = visibleIds.value.filter((tag) => {
                const inst = instances.get(tag);
                return force || !inst || now - inst.fetchedAt > maxAge;
            });
            for (const tag of targets) {
                await fetchInstance(tag);
                await sleep(250); // be gentle with the VRChat API
            }
            lastUpdated.value = Date.now();
        } finally {
            refreshing.value = false;
        }
    }

    function setVisible(cardsOnPage = []) {
        visibleIds.value = cardsOnPage.map((c) => c.id);
        refresh();
    }

    let timer = null;
    function restartTimer() {
        clearInterval(timer);
        const seconds = Math.max(15, Number(launcherTheme.refreshSeconds) || 60);
        timer = setInterval(() => refresh(), seconds * 1000);
    }
    watch(() => launcherTheme.refreshSeconds, restartTimer, { immediate: true });
    onBeforeUnmount(() => clearInterval(timer));

    const stats = computed(() => ({
        instances: cards.value.length,
        friendsInGame: cards.value.reduce((n, c) => n + c.friendCount, 0),
        online: (vipFriends.value?.length || 0) + (onlineFriends.value?.length || 0)
    }));

    return { cards, stats, refresh, refreshing, lastUpdated, setVisible };
}
