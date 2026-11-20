/* Fake data for the browser preview. Images are generated so it works offline. */

const WORLDS = [
    ['The Black Cat', 20, 'public', 'us', 40],
    ['Midnight Rooftop', 260, 'friends+', 'eu', 32],
    ['Just B Club', 300, 'public', 'use', 80],
    ['Comfy Cabin', 30, 'friends', 'eu', 16],
    ['Murder 4', 0, 'public', 'us', 24],
    ['Udon Arena', 200, 'groupPublic', 'use', 40],
    ['Sakura Hotel', 340, 'invite+', 'jp', 20],
    ['Optimized Movie World', 220, 'friends+', 'us', 64],
    ['Ghost Club', 280, 'invite', 'eu', 30],
    ['Treehouse in the Shade', 120, 'public', 'us', 40],
    ['Pool Party Paradise', 190, 'friends+', 'use', 40],
    ['Neon District', 310, 'group', 'jp', 50],
    ['Prison Escape', 15, 'public', 'eu', 32],
    ['Chill Lofi Room', 250, 'friends', 'us', 12],
    ['Space Station Omega', 210, 'public', 'use', 40],
    ['Desert Oasis', 45, 'friends+', 'eu', 24],
    ['Karaoke Night', 330, 'public', 'jp', 30],
    ['Avatar Testing Chamber', 170, 'public', 'us', 80],
    ['Snowy Village', 195, 'friends+', 'eu', 20],
    ['Cyber Café', 290, 'invite+', 'use', 16],
    ['Library of Babel', 35, 'public', 'us', 40],
    ['Rooftop Rave', 315, 'groupPlus', 'eu', 60],
    ['Fishing Lake', 140, 'friends', 'us', 16],
    ['Mirror Lounge', 275, 'friends+', 'jp', 24],
    ['Haunted Mansion', 10, 'public', 'use', 32],
    ['Zen Garden', 100, 'friends+', 'eu', 12],
    ['Bowling Alley', 55, 'public', 'us', 40],
    ['Starlit Beach', 230, 'friends', 'use', 20]
];

const NAMES = [
    'Raido',
    'Michael',
    'Serion',
    'Kitsune',
    'Nyx',
    'Pixel',
    'Aurora',
    'Byte',
    'Comet',
    'Dusk',
    'Echo',
    'Fable',
    'Glimmer',
    'Halo',
    'Iris',
    'Jinx',
    'Koda',
    'Lumen',
    'Mochi',
    'Nova',
    'Onyx',
    'Pip',
    'Quill',
    'Rune',
    'Sable',
    'Tofu',
    'Umbra',
    'Vex',
    'Wisp',
    'Yuki',
    'Zephyr',
    'Ash',
    'Bramble',
    'Cinder',
    'Delta',
    'Ember',
    'Frost',
    'Gale',
    'Hex',
    'Indigo',
    'Juniper',
    'Kestrel',
    'Lark',
    'Mint',
    'Nimbus',
    'Opal',
    'Pyre',
    'Quartz',
    'Rook',
    'Sorrel',
    'Tango',
    'Ursa',
    'Vale',
    'Willow',
    'Xeno',
    'Yarrow',
    'Zinnia',
    'Amber',
    'Basil',
    'Cobalt',
    'Dune',
    'Elm',
    'Fern',
    'Gizmo',
    'Hazel',
    'Ivy',
    'Jade',
    'Kiwi',
    'Lotus',
    'Maple',
    'Neon',
    'Olive',
    'Panda',
    'Ripple',
    'Sprout'
];

const STATUSES = ['active', 'joinme', 'joinme', 'active', 'askme', 'busy'];

function seeded(seed) {
    let s = seed;
    return () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
    };
}

export function worldArt(name, hue) {
    const r = seeded(name.length * 97 + hue);
    const shapes = Array.from({ length: 6 }, (_, i) => {
        const cx = Math.round(r() * 400);
        const cy = Math.round(r() * 225);
        const rad = Math.round(30 + r() * 110);
        const h = (hue + i * 35) % 360;
        return `<circle cx='${cx}' cy='${cy}' r='${rad}' fill='hsl(${h},75%,${45 + r() * 25}%)' opacity='${0.35 + r() * 0.4}'/>`;
    }).join('');
    const horizon = Math.round(120 + r() * 60);
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 225'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='hsl(${hue},60%,22%)'/><stop offset='1' stop-color='hsl(${(hue + 50) % 360},70%,12%)'/></linearGradient><filter id='b'><feGaussianBlur stdDeviation='14'/></filter></defs><rect width='400' height='225' fill='url(#g)'/><g filter='url(#b)'>${shapes}</g><path d='M0 ${horizon} Q100 ${horizon - 30} 200 ${horizon} T400 ${horizon - 10} V225 H0Z' fill='hsl(${(hue + 200) % 360},40%,10%)' opacity='0.75'/><path d='M0 ${horizon + 25} Q120 ${horizon} 240 ${horizon + 20} T400 ${horizon + 15} V225 H0Z' fill='hsl(${(hue + 210) % 360},40%,6%)' opacity='0.9'/></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function avatarArt(name) {
    let h = 0;
    for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><defs><linearGradient id='a' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl(${h},80%,65%)'/><stop offset='1' stop-color='hsl(${(h + 60) % 360},70%,45%)'/></linearGradient></defs><rect width='64' height='64' fill='url(#a)'/><text x='32' y='41' font-family='Segoe UI,Arial' font-size='26' font-weight='700' text-anchor='middle' fill='white'>${name.slice(0, 2)}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const ACCESS = {
    public: ['public', 'Public', true],
    'friends+': ['friends', 'Friends+', true],
    friends: ['friends', 'Friends', true],
    'invite+': ['invite', 'Invite+', false],
    invite: ['invite', 'Invite', false],
    group: ['group', 'Group', true],
    groupPublic: ['group', 'Group Public', true],
    groupPlus: ['group', 'Group+', true]
};
const REGIONS = { us: 'US W', use: 'US E', eu: 'EU', jp: 'JP' };

export function buildMockCards() {
    const r = seeded(42);
    let nameIdx = 0;
    return WORLDS.map(([name, hue, access, region, cap], i) => {
        const friendCount = i === 0 ? 7 : Math.max(1, Math.round(r() * 5 + (i < 6 ? 2 : 0)));
        const friends = Array.from({ length: friendCount }, () => {
            const n = NAMES[nameIdx++ % NAMES.length];
            return {
                id: `usr_${n.toLowerCase()}_${i}`,
                name: n,
                image: avatarArt(n),
                status: STATUSES[Math.floor(r() * STATUSES.length)]
            };
        });
        const [kind, label, joinable] = ACCESS[access];
        const img = worldArt(name, hue);
        return {
            id: `wrld_${i}:${10000 + i}~region(${region})`,
            location: `wrld_${i}:${10000 + i}`,
            worldName: name,
            thumbnail: img,
            image: img,
            loading: false,
            accessKind: kind,
            accessLabel: label,
            joinable: joinable || i === 3,
            region: REGIONS[region],
            isOwnLocation: i === 3,
            userCount: Math.min(cap, friendCount + Math.round(r() * cap * 0.7)),
            capacity: cap,
            friendCount,
            friends
        };
    });
}

export function buildFriendLog() {
    const types = ['Friend', 'Unfriend', 'DisplayName', 'TrustLevel', 'FriendRequest'];
    const r = seeded(7);
    const now = Date.now();
    return Array.from({ length: 40 }, (_, i) => {
        const name = NAMES[(i * 7) % NAMES.length];
        const type = types[Math.floor(r() * types.length)];
        return {
            id: i,
            time: new Date(now - i * 1000 * 60 * (20 + r() * 300)),
            type,
            name,
            image: avatarArt(name),
            detail:
                type === 'DisplayName'
                    ? `was ${NAMES[(i * 3 + 5) % NAMES.length]}_vr`
                    : type === 'TrustLevel'
                      ? 'Known User → Trusted User'
                      : ''
        };
    });
}

export function buildGameLog() {
    const r = seeded(11);
    const types = ['Location', 'OnPlayerJoined', 'OnPlayerLeft', 'VideoPlay', 'PortalSpawn', 'OnPlayerJoined'];
    const now = Date.now();
    return Array.from({ length: 50 }, (_, i) => {
        const type = types[Math.floor(r() * types.length)];
        const name = NAMES[(i * 5 + 3) % NAMES.length];
        const world = WORLDS[(i * 3) % WORLDS.length];
        return {
            id: i,
            time: new Date(now - i * 1000 * 60 * (3 + r() * 25)),
            type,
            name: type === 'Location' ? world[0] : type === 'VideoPlay' ? 'lofi hip hop radio - beats to relax' : name,
            image: type === 'Location' ? worldArt(world[0], world[1]) : avatarArt(name),
            detail:
                type === 'Location'
                    ? `${REGIONS[world[3]]} · ${ACCESS[world[2]][1]}`
                    : type === 'VideoPlay'
                      ? `requested by ${name}`
                      : ''
        };
    });
}

export const mockUser = { id: 'usr_me', name: 'vEonz', image: avatarArt('vEonz'), status: 'joinme' };
