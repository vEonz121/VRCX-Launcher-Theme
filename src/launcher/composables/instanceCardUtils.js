/** Pure helpers shared by the live app and the browser preview. */

const ACCESS = {
    public: { kind: 'public', label: 'Public', joinable: true },
    'friends+': { kind: 'friends', label: 'Friends+', joinable: true },
    friends: { kind: 'friends', label: 'Friends', joinable: true },
    'invite+': { kind: 'invite', label: 'Invite+', joinable: false },
    invite: { kind: 'invite', label: 'Invite', joinable: false },
    group: { kind: 'group', label: 'Group', joinable: true },
    groupPublic: { kind: 'group', label: 'Group Public', joinable: true },
    groupPlus: { kind: 'group', label: 'Group+', joinable: true }
};

export function accessInfo(name) {
    return ACCESS[name] || { kind: 'other', label: name || 'Instance', joinable: true };
}

const REGIONS = { us: 'US W', use: 'US E', usw: 'US W', eu: 'EU', jp: 'JP' };

export function regionLabel(code) {
    if (!code) return '';
    return REGIONS[code] || String(code).toUpperCase();
}

export function statusKey(status) {
    switch (status) {
        case 'join me':
            return 'joinme';
        case 'ask me':
            return 'askme';
        case 'busy':
            return 'busy';
        case 'active':
            return 'active';
        default:
            return 'active';
    }
}
