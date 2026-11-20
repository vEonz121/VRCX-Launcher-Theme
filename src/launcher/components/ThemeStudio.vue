<template>
    <div class="vl-studio vl-scroll">
        <div class="vl-studio__head">
            <div>
                <h1>Theme Studio</h1>
                <p>Changes apply live and are saved on this PC.</p>
            </div>
            <button type="button" class="vl-btn vl-btn--glass" @click="reset">
                <RotateCcw class="size-4" /> Reset
            </button>
        </div>

        <section class="vl-panel">
            <h2>Presets</h2>
            <div class="vl-presets">
                <button
                    v-for="p in themePresets"
                    :key="p.id"
                    type="button"
                    class="vl-preset"
                    :style="{ '--ph': p.values.hue }"
                    @click="applyPreset(p.id)">
                    <span class="vl-preset__swatch" :class="`is-${p.values.background}`"></span>
                    <span class="vl-preset__label">{{ p.label }}</span>
                </button>
            </div>
        </section>

        <section class="vl-panel">
            <h2>Background</h2>
            <div class="vl-bgchoices">
                <button
                    v-for="b in backgroundPresets"
                    :key="b.id"
                    type="button"
                    class="vl-bgchoice"
                    :class="{ 'is-active': theme.background === b.id }"
                    @click="theme.background = b.id">
                    <span class="vl-bgchoice__thumb" :class="`is-${b.id}`"></span>
                    <span class="vl-bgchoice__label">{{ b.label }}</span>
                    <span class="vl-bgchoice__desc">{{ b.description }}</span>
                </button>
            </div>
            <label v-if="theme.background === 'image'" class="vl-field">
                <span>Image URL</span>
                <input
                    v-model.trim="theme.imageUrl"
                    type="url"
                    class="vl-input"
                    placeholder="https://…/wallpaper.jpg" />
            </label>
        </section>

        <section class="vl-panel">
            <h2>Friend icons</h2>
            <div class="vl-sample">
                <div>
                    <Range
                        v-model="theme.avatarSize"
                        label="Friend circle size"
                        :min="20"
                        :max="48"
                        :step="1"
                        unit="px" />
                    <p class="vl-hint">
                        Size of the friend pictures on Home cards. The example card on the right updates as you drag.
                    </p>
                </div>
                <div class="vl-sample__card">
                    <InstanceCard :card="sampleCard" :join-mode="theme.joinMode" />
                </div>
            </div>
        </section>

        <div class="vl-studio__cols">
            <section class="vl-panel">
                <h2>Accent colour</h2>
                <div class="vl-swatches">
                    <button
                        v-for="a in accentPresets"
                        :key="a.id"
                        type="button"
                        class="vl-swatch"
                        :class="{ 'is-active': Math.round(theme.hue) === a.hue }"
                        :style="{ '--sh': a.hue }"
                        :title="a.label"
                        @click="theme.hue = a.hue"></button>
                </div>
                <Range v-model="theme.hue" label="Hue" :min="0" :max="360" :step="1" hue />
                <Range v-model="theme.tint" label="Background tint" :min="0" :max="1" :step="0.05" percent />
            </section>

            <section class="vl-panel">
                <h2>Glass</h2>
                <Range v-model="theme.glassOpacity" label="Panel opacity" :min="0.02" :max="0.4" :step="0.01" percent />
                <Range v-model="theme.blur" label="Blur" :min="0" :max="48" :step="1" unit="px" />
                <Range v-model="theme.radius" label="Roundness" :min="4" :max="36" :step="1" unit="px" />
            </section>

            <section class="vl-panel">
                <h2>Motion</h2>
                <Range v-model="theme.motion" label="Animation speed" :min="0" :max="2" :step="0.1" unit="×" />
                <Toggle v-model="theme.transitions" label="Page transitions" />
                <p class="vl-hint">Set speed to 0 to freeze the background while you're in VR.</p>
            </section>

            <section class="vl-panel">
                <h2>Home grid</h2>
                <Range v-model="theme.gridColumns" label="Max columns" :min="2" :max="8" :step="1" />
                <Range v-model="theme.gridRows" label="Max rows" :min="1" :max="6" :step="1" />
                <Range
                    v-model="theme.minCardWidth"
                    label="Smallest card width"
                    :min="160"
                    :max="360"
                    :step="10"
                    unit="px" />
                <Range
                    v-model="theme.minCardHeight"
                    label="Smallest card height"
                    :min="110"
                    :max="260"
                    :step="10"
                    unit="px" />
                <Range
                    v-model="theme.refreshSeconds"
                    label="Player count refresh"
                    :min="15"
                    :max="300"
                    :step="15"
                    unit="s" />
                <Toggle v-model="theme.includeSolo" label="Show instances with one friend" />
                <p class="vl-hint">
                    When the friends sidebar or bottom panel takes space, rows and columns drop so cards never get
                    smaller than this.
                </p>
            </section>

            <section class="vl-panel">
                <h2>Panels &amp; friends</h2>
                <Toggle v-model="theme.sidebarOpen" label="Friends sidebar" />
                <Range v-model="theme.sidebarWidth" label="Sidebar width" :min="240" :max="640" :step="10" unit="px" />
                <Range
                    v-model="theme.dockHeight"
                    label="Bottom panel height"
                    :min="160"
                    :max="700"
                    :step="10"
                    unit="px" />
                <Toggle v-model="theme.friendBanners" label="Profile banners on friend cards" />
                <p class="vl-hint">You can also drag the panel edges to resize them.</p>
            </section>

            <section class="vl-panel">
                <h2>Layout</h2>
                <Toggle v-model="theme.clock24h" label="24-hour clock" />
                <Toggle
                    :model-value="!theme.enabled"
                    label="Use classic VRCX layout"
                    @update:model-value="(v) => (theme.enabled = !v)" />
                <p class="vl-hint">
                    The classic sidebar layout is still there. Switch back any time from its menu: Theme Studio is
                    listed as a page.
                </p>
            </section>
        </div>
    </div>
</template>

<script setup>
    import { defineComponent, h } from 'vue';
    import { RotateCcw } from 'lucide-vue-next';

    import InstanceCard from './InstanceCard.vue';
    import { avatarArt, worldArt } from '../preview/mockData';

    import { accentPresets, backgroundPresets, themePresets, useLauncherTheme } from '../theme/useLauncherTheme';

    const { theme, applyPreset, reset } = useLauncherTheme();

    // example card for the friend-circle slider (made-up data, generated pictures)
    const sampleNames = ['Raido', 'Michael', 'Serion', 'Nova', 'Pixel', 'Kitsune', 'Echo'];
    const sampleArt = worldArt('Sample World', 225);
    const sampleCard = {
        id: 'sample',
        location: 'wrld_sample:1',
        worldName: 'Example World',
        thumbnail: sampleArt,
        image: sampleArt,
        loading: false,
        accessKind: 'friends',
        accessLabel: 'Friends+',
        joinable: true,
        region: 'EU',
        isOwnLocation: false,
        userCount: 14,
        capacity: 32,
        friendCount: sampleNames.length,
        friends: sampleNames.map((n, i) => ({
            id: `sample_${i}`,
            name: n,
            image: avatarArt(n),
            status: ['joinme', 'active', 'askme', 'busy'][i % 4]
        }))
    };

    const Range = defineComponent({
        props: {
            modelValue: { type: Number, default: 0 },
            label: String,
            min: Number,
            max: Number,
            step: Number,
            unit: { type: String, default: '' },
            percent: Boolean,
            hue: Boolean
        },
        emits: ['update:modelValue'],
        setup(props, { emit }) {
            return () => {
                const v = Number(props.modelValue);
                const shown = props.percent
                    ? `${Math.round(v * 100)}%`
                    : `${Number.isInteger(props.step) ? Math.round(v) : v.toFixed(1)}${props.unit}`;
                const pct = ((v - props.min) / (props.max - props.min)) * 100;
                return h('label', { class: 'vl-range' }, [
                    h('span', { class: 'vl-range__top' }, [h('span', props.label), h('b', shown)]),
                    h('input', {
                        type: 'range',
                        class: ['vl-range__input', props.hue && 'is-hue'],
                        min: props.min,
                        max: props.max,
                        step: props.step,
                        value: v,
                        style: { '--p': `${pct}%` },
                        onInput: (e) => emit('update:modelValue', Number(e.target.value))
                    })
                ]);
            };
        }
    });

    const Toggle = defineComponent({
        props: { modelValue: Boolean, label: String },
        emits: ['update:modelValue'],
        setup(props, { emit }) {
            return () =>
                h(
                    'button',
                    {
                        type: 'button',
                        role: 'switch',
                        'aria-checked': props.modelValue,
                        class: ['vl-toggle', props.modelValue && 'is-on'],
                        onClick: () => emit('update:modelValue', !props.modelValue)
                    },
                    [
                        h('span', { class: 'vl-toggle__label' }, props.label),
                        h('span', { class: 'vl-toggle__track' }, [h('i')])
                    ]
                );
        }
    });
</script>
