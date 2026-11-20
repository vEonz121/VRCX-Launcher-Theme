<template>
    <article
        class="vl-card"
        :class="{ 'is-focused': focused, 'is-here': card.isOwnLocation, 'is-locked': !card.joinable }"
        :style="{ '--i': index }"
        tabindex="0"
        @mouseenter="$emit('focus', card)"
        @focus="$emit('focus', card)"
        @dblclick="card.joinable && $emit('join', card)"
        @keydown.enter.prevent="card.joinable && $emit('join', card)">
        <div class="vl-card__media" @click="$emit('open-world', card)">
            <img
                v-if="card.thumbnail"
                :src="card.thumbnail"
                class="vl-card__img"
                loading="lazy"
                decoding="async"
                alt=""
                draggable="false" />
            <div v-else class="vl-card__img vl-card__img--placeholder">
                <Globe class="size-8 opacity-40" />
            </div>
            <div class="vl-card__shade"></div>

            <div class="vl-card__badges">
                <span class="vl-pill" :class="`vl-pill--${card.accessKind || 'other'}`">
                    <Lock v-if="!card.joinable" class="size-3" />
                    {{ card.accessLabel }}
                </span>
                <span v-if="card.region" class="vl-pill vl-pill--ghost">{{ card.region }}</span>
                <span v-if="card.isOwnLocation" class="vl-pill vl-pill--here">You're here</span>
            </div>

            <div class="vl-card__count" :title="countTitle">
                <Users class="size-3.5" />
                <template v-if="card.userCount != null">
                    {{ card.userCount }}<span v-if="card.capacity" class="opacity-60">/{{ card.capacity }}</span>
                </template>
                <template v-else>{{ card.friendCount }}+</template>
            </div>
        </div>

        <div class="vl-card__body">
            <div class="vl-card__title" :title="card.worldName">
                <span v-if="card.loading && !card.worldName" class="vl-skel w-2/3"></span>
                <template v-else>{{ card.worldName || 'Unknown world' }}</template>
            </div>

            <div class="vl-card__row">
                <div class="vl-avatars" @click.stop>
                    <button
                        v-for="(f, fi) in visibleFriends"
                        :key="f.id"
                        type="button"
                        class="vl-avatar"
                        :style="{ zIndex: 20 - fi }"
                        :title="f.name"
                        @click="$emit('open-user', f.id)">
                        <img v-if="f.image" :src="f.image" alt="" loading="lazy" draggable="false" />
                        <span v-else>{{ (f.name || '?').slice(0, 1) }}</span>
                        <i class="vl-avatar__dot" :class="`is-${f.status || 'active'}`"></i>
                    </button>
                    <span v-if="hiddenFriends > 0" class="vl-avatar vl-avatar--more">+{{ hiddenFriends }}</span>
                </div>
                <div class="vl-card__friends">
                    {{ card.friendCount }} {{ card.friendCount === 1 ? 'friend' : 'friends' }}
                </div>
                <button
                    type="button"
                    class="vl-join"
                    :class="{ 'is-busy': busy }"
                    :disabled="busy || (!card.joinable && !card.friends.length)"
                    :title="card.joinable ? joinTitle : 'Invite-only: ask a friend in here for an invite'"
                    @click.stop="card.joinable ? $emit('join', card) : $emit('request-invite', card)">
                    <Loader2 v-if="busy" class="size-5 animate-spin" />
                    <Play v-else-if="card.joinable" class="size-5 translate-x-px" fill="currentColor" />
                    <Hand v-else class="size-4" />
                    <span class="vl-join__label">{{ card.joinable ? joinLabel : 'Ask to join' }}</span>
                </button>
            </div>
        </div>

        <div class="vl-card__actions" @click.stop>
            <DropdownMenu>
                <DropdownMenuTrigger as-child>
                    <button type="button" class="vl-iconbtn" aria-label="More actions">
                        <MoreHorizontal class="size-4" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="vl-menu">
                    <DropdownMenuItem :disabled="!card.joinable" @click="$emit('join', card, 'vr')">
                        <Glasses class="size-4" /> Launch in VR
                    </DropdownMenuItem>
                    <DropdownMenuItem :disabled="!card.joinable" @click="$emit('join', card, 'desktop')">
                        <Monitor class="size-4" /> Launch in desktop mode
                    </DropdownMenuItem>
                    <DropdownMenuItem :disabled="!card.joinable" @click="$emit('self-invite', card)">
                        <Send class="size-4" /> Send myself an invite
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem @click="$emit('open-world', card)">
                        <Globe class="size-4" /> World details
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="$emit('launch-dialog', card)">
                        <Link class="size-4" /> Launch options &amp; link
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    </article>
</template>

<script setup>
    import { computed } from 'vue';
    import {
        Glasses,
        Globe,
        Hand,
        Link,
        Loader2,
        Lock,
        Monitor,
        MoreHorizontal,
        Play,
        Send,
        Users
    } from 'lucide-vue-next';

    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuSeparator,
        DropdownMenuTrigger
    } from '@/components/ui/dropdown-menu';

    const props = defineProps({
        card: { type: Object, required: true },
        index: { type: Number, default: 0 },
        focused: { type: Boolean, default: false },
        busy: { type: Boolean, default: false },
        joinMode: { type: String, default: 'vr' },
        maxAvatars: { type: Number, default: 5 }
    });

    defineEmits(['join', 'self-invite', 'open-world', 'open-user', 'launch-dialog', 'focus', 'request-invite']);

    const visibleFriends = computed(() => props.card.friends.slice(0, props.maxAvatars));
    const hiddenFriends = computed(() => Math.max(0, props.card.friends.length - props.maxAvatars));
    const joinLabel = computed(() => (props.joinMode === 'desktop' ? 'Join' : 'Join VR'));
    const joinTitle = computed(() =>
        props.joinMode === 'desktop'
            ? 'Launch VRChat (desktop) into this instance'
            : 'Launch VRChat in VR into this instance'
    );
    const countTitle = computed(() =>
        props.card.userCount != null
            ? `${props.card.userCount} players in instance${props.card.capacity ? ` (cap ${props.card.capacity})` : ''}`
            : 'Player count loading…'
    );
</script>
