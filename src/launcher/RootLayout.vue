<template>
    <LauncherLayout v-if="launcherTheme.enabled" />
    <template v-else>
        <MainLayout />
        <button
            v-if="watchState.isLoggedIn"
            type="button"
            class="fixed bottom-7 left-1/2 z-40 -translate-x-1/2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs shadow-lg backdrop-blur hover:bg-accent"
            title="Switch back to the launcher layout"
            @click="launcherTheme.enabled = true">
            ✨ Launcher layout
        </button>
    </template>
</template>

<script setup>
    import { launcherTheme } from './theme/useLauncherTheme';
    import { watchState } from '../services/watchState';

    import LauncherLayout from './LauncherLayout.vue';
    import MainLayout from '../views/Layout/MainLayout.vue';
</script>
