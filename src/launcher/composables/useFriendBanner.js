import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { queryRequest } from '../../api';
import { launcherTheme } from '../theme/useLauncherTheme';

/**
 * Profile banners for friend cards.
 *
 * VRChat's friends list doesn't always include a friend's banner, so the
 * full profile is fetched once per friend the first time their card scrolls
 * into view. Requests go through a slow shared queue (one at a time, spaced
 * out) so a big friends list never floods the VRChat API.
 */

const attempted = new Set();
const queue = [];
let running = false;
const SPACING_MS = 700;

async function pump() {
    if (running) return;
    running = true;
    try {
        while (queue.length) {
            const userId = queue.shift();
            try {
                await queryRequest.fetch('user', { userId });
            } catch {
                // private/blocked/rate-limited: just leave this card plain
            }
            await new Promise((r) => setTimeout(r, SPACING_MS));
        }
    } finally {
        running = false;
    }
}

function request(userId) {
    if (!userId || attempted.has(userId)) return;
    attempted.add(userId);
    queue.push(userId);
    pump();
}

/** @param {import('vue').Ref<object>} friendRef Reactive friend entry ({ id, ref }) */
export function useFriendBanner(friendRef, sentinelRef) {
    const failed = ref(false);
    const visible = ref(false);

    const user = computed(() => friendRef.value?.ref || {});

    const bannerUrl = computed(() => {
        if (!launcherTheme.friendBanners || failed.value) return '';
        const u = user.value;
        if (!u.bannerUrl || u.bannerType === 'color') return '';
        return u.bannerUrl;
    });

    const bannerColor = computed(() => {
        if (!launcherTheme.friendBanners) return '';
        const c = user.value.bannerColor;
        return c ? `#${String(c).replace(/^#/, '')}` : '';
    });

    const needsFetch = computed(() => {
        const u = user.value;
        return launcherTheme.friendBanners && !!friendRef.value?.id && !u.bannerUrl && !u.bannerColor;
    });

    watch([visible, needsFetch], ([v, need]) => {
        if (v && need) request(friendRef.value.id);
    });
    watch(
        () => user.value.bannerUrl,
        () => (failed.value = false)
    );

    let io = null;
    onMounted(() => {
        const el = sentinelRef.value;
        if (!el || typeof IntersectionObserver === 'undefined') {
            visible.value = true;
            return;
        }
        io = new IntersectionObserver((entries) => {
            visible.value = entries.some((e) => e.isIntersecting);
        });
        io.observe(el);
    });
    onBeforeUnmount(() => io?.disconnect());

    return { bannerUrl, bannerColor, onBannerError: () => (failed.value = true) };
}
