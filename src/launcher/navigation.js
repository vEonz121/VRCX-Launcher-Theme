/**
 * Launcher tab structure. Every original VRCX page is reachable from here:
 * each top tab owns a set of sub-pages that map to the original routes,
 * so the original views (and their data loading) are reused untouched.
 */
export const launcherTabs = [
    {
        key: 'home',
        label: 'Home',
        icon: 'House',
        pages: [{ route: 'home', label: 'Instances' }]
    },
    {
        key: 'friends',
        label: 'Friends',
        icon: 'Users',
        pages: [
            { route: 'friends-locations', label: 'Locations', labelKey: 'nav_tooltip.friends_locations' },
            { route: 'friend-list', label: 'Friend List', labelKey: 'nav_tooltip.friend_list' },
            { route: 'favorite-friends', label: 'Favorites', labelKey: 'nav_tooltip.favorite_friends' },
            { route: 'player-list', label: 'Players Here', labelKey: 'nav_tooltip.player_list' }
        ]
    },
    {
        key: 'logs',
        label: 'Logs',
        icon: 'ScrollText',
        pages: [
            { route: 'friend-log', label: 'Friend Log', labelKey: 'nav_tooltip.friend_log' },
            { route: 'game-log', label: 'Game Log', labelKey: 'nav_tooltip.game_log' },
            { route: 'feed', label: 'Feed', labelKey: 'nav_tooltip.feed' },
            { route: 'notification', label: 'Notifications', labelKey: 'nav_tooltip.notification' },
            { route: 'moderation', label: 'Moderation', labelKey: 'nav_tooltip.moderation' }
        ]
    },
    {
        key: 'explore',
        label: 'Worlds & Avatars',
        icon: 'Compass',
        pages: [
            { route: 'search', label: 'Search', labelKey: 'nav_tooltip.search' },
            { route: 'favorite-worlds', label: 'Favorite Worlds', labelKey: 'nav_tooltip.favorite_worlds' },
            { route: 'favorite-avatars', label: 'Favorite Avatars', labelKey: 'nav_tooltip.favorite_avatars' },
            { route: 'my-avatars', label: 'My Avatars', labelKey: 'nav_tooltip.my_avatars' }
        ]
    },
    {
        key: 'insights',
        label: 'Insights',
        icon: 'ChartPie',
        pages: [
            { route: 'charts-instance', label: 'Instance Activity', labelKey: 'view.charts.instance_activity.header' },
            { route: 'charts-mutual', label: 'Mutual Friends', labelKey: 'view.charts.mutual_friend.tab_label' },
            { route: 'charts-hot-worlds', label: 'Hot Worlds', labelKey: 'view.charts.hot_worlds.tab_label' }
            // user dashboards are appended at runtime
        ]
    },
    {
        key: 'tools',
        label: 'Tools',
        icon: 'Wrench',
        pages: [
            { route: 'tools', label: 'All Tools', labelKey: 'nav_tooltip.tools' },
            { route: 'gallery', label: 'Gallery' },
            { route: 'screenshot-metadata', label: 'Screenshots' },
            { route: 'vrchat-store', label: 'Store' }
        ]
    },
    {
        key: 'theme',
        label: 'Theme',
        icon: 'Palette',
        pages: [{ route: 'launcher-theme', label: 'Theme Studio' }]
    },
    {
        key: 'settings',
        label: 'Settings',
        icon: 'Settings',
        pages: [{ route: 'settings', label: 'Settings' }]
    }
];

/** Route name → owning tab key */
export function findTabForRoute(tabs, routeName) {
    for (const tab of tabs) {
        if (tab.pages.some((p) => p.route === routeName)) return tab.key;
    }
    return null;
}
