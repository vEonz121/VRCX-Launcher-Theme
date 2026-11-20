import { onBeforeUnmount, onMounted } from 'vue';

import { applyCssVariables } from './useLauncherTheme';

import '../launcher.css';

/**
 * While the launcher shell is mounted, put <html> into the glass theme.
 * The launcher is designed as a dark glass UI, so the `dark` class is kept on
 * even if the classic theme setting is light (it is restored on unmount).
 */
export function useLauncherShellClass() {
    let observer = null;
    let hadDark = false;

    onMounted(() => {
        const root = document.documentElement;
        hadDark = root.classList.contains('dark');
        root.classList.add('vl-launcher', 'dark');
        applyCssVariables(root);
        observer = new MutationObserver(() => {
            if (!root.classList.contains('dark')) root.classList.add('dark');
        });
        observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    });

    onBeforeUnmount(() => {
        observer?.disconnect();
        const root = document.documentElement;
        root.classList.remove('vl-launcher');
        if (!hadDark) root.classList.remove('dark');
    });
}
