import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';

const mocks = vi.hoisted(() => ({
    vip: null,
    online: null,
    lastLocation: null,
    fetch: vi.fn(),
    getInstance: vi.fn()
}));

vi.mock('pinia', () => ({ storeToRefs: (s) => s }));

vi.mock('../../stores', () => {
    const { ref } = require('vue');
    mocks.vip = ref([]);
    mocks.online = ref([]);
    mocks.lastLocation = ref({ location: '', friendList: new Map() });
    return {
        useFriendStore: () => ({ vipFriends: mocks.vip, onlineFriends: mocks.online }),
        useLocationStore: () => ({ lastLocation: mocks.lastLocation }),
        useWorldStore: () => ({ cachedWorlds: new Map() })
    };
});

vi.mock('../../api', () => ({
    queryRequest: { fetch: mocks.fetch },
    instanceRequest: { getInstance: mocks.getInstance }
}));

vi.mock('../../composables/useUserDisplay', () => ({
    useUserDisplay: () => ({ userImage: (u) => `img:${u?.id}` })
}));

import { useInstanceCards } from '../composables/useInstanceCards';

const friend = (id, location, extra = {}) => ({
    id,
    name: id,
    state: 'online',
    ref: { id, displayName: id, location, $location: { tag: location }, status: 'join me' },
    ...extra
});

function setup() {
    let api;
    const Comp = defineComponent({
        setup() {
            api = useInstanceCards();
            return () => h('div');
        }
    });
    mount(Comp);
    return api;
}

describe('useInstanceCards', () => {
    test('groups online friends into one card per real instance, skipping private', async () => {
        mocks.fetch.mockResolvedValue({ ref: { name: 'The Black Cat', thumbnailImageUrl: 't.png', capacity: 40 } });
        mocks.getInstance.mockResolvedValue({ json: { n_users: 12, capacity: 40 } });
        const a = 'wrld_a:111~region(eu)';
        const b = 'wrld_b:222~friends(usr_x)~region(us)';
        mocks.vip.value = [friend('v1', a, { isVIP: true })];
        mocks.online.value = [friend('o1', a), friend('o2', b), friend('o3', 'private'), friend('o4', a)];

        const { cards, stats } = setup();
        await nextTick();

        expect(cards.value).toHaveLength(2);
        expect(cards.value[0].location).toBe(a);
        expect(cards.value[0].friendCount).toBe(3);
        expect(cards.value[0].region).toBe('EU');
        expect(cards.value[0].friends[0]).toMatchObject({ id: 'v1', status: 'joinme', image: 'img:v1' });
        expect(cards.value[1].accessLabel).toBe('Friends');
        expect(stats.value.friendsInGame).toBe(4);

        await vi.waitFor(() => expect(cards.value[0].worldName).toBe('The Black Cat'));
        expect(cards.value[0].thumbnail).toBe('t.png');
    });

    test('own instance is first and invite-only instances are not joinable', async () => {
        const inv = 'wrld_c:333~private(usr_y)~region(us)';
        const mine = 'wrld_d:444~region(jp)';
        mocks.vip.value = [];
        mocks.online.value = [friend('p1', inv), friend('p2', inv)];
        mocks.lastLocation.value = { location: mine, friendList: new Map() };

        const { cards } = setup();
        await nextTick();

        expect(cards.value[0].isOwnLocation).toBe(true);
        expect(cards.value[0].friendCount).toBe(0);
        const invite = cards.value.find((c) => c.location === inv);
        expect(invite.joinable).toBe(false);
    });

    test('fetches live player counts only for the visible cards', async () => {
        mocks.getInstance.mockClear();
        mocks.getInstance.mockResolvedValue({ json: { n_users: 7, capacity: 32 } });
        const a = 'wrld_e:555~region(eu)';
        mocks.lastLocation.value = { location: '', friendList: new Map() };
        mocks.online.value = [friend('q1', a)];

        const { cards, setVisible } = setup();
        await nextTick();
        setVisible(cards.value);
        await vi.waitFor(() => expect(cards.value[0].userCount).toBe(7));
        expect(mocks.getInstance).toHaveBeenCalledWith({ worldId: 'wrld_e', instanceId: '555~region(eu)' });
        expect(cards.value[0].capacity).toBe(32);
    });
});

// keep `ref` import used for linters
void ref;
