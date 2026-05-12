<!-- MainMenuSection.svelte — Tactical navigation cards (no Technical Specs widget) -->
<script lang="ts">
  interface MenuItem {
    id: string;
    icon: string;
    label: string;
    desc: string;
    action: () => void;
    disabled?: () => boolean;
    accent?: 'primary' | 'secondary' | 'tertiary';
  }

  interface Props {
    hasSave: boolean;
    onContinue: () => void;
    onLeaderboard: () => void;
    onHowToPlay: () => void;
    onDebug: () => void;
  }
  let { hasSave, onContinue, onLeaderboard, onHowToPlay, onDebug }: Props = $props();

  const menuItems: MenuItem[] = [
    {
      id: '01',
      icon: 'history',
      label: 'Continue',
      desc: 'Resume active infiltration at your last checkpoint.',
      action: () => onContinue(),
      disabled: () => !hasSave,
      accent: 'primary',
    },
    {
      id: '02',
      icon: 'leaderboard',
      label: 'Leaderboards',
      desc: 'Global efficiency rankings and top survival times.',
      action: () => onLeaderboard(),
      accent: 'primary',
    },
    {
      id: '03',
      icon: 'help_outline',
      label: 'How to Play',
      desc: 'Accessing system manual — controls, objectives, survival tips.',
      action: () => onHowToPlay(),
      accent: 'primary',
    },
    {
      id: '04',
      icon: 'biotech',
      label: 'Debug Mode',
      desc: 'Action Replay & Algorithmic Analysis — developer access only.',
      action: () => onDebug(),
      accent: 'tertiary',
    },
  ];
</script>

<section class="py-20 bg-surface-container-lowest border-y border-outline-variant/30">
  <div class="container mx-auto px-margin">

    <!-- Section label -->
    <div class="mb-8">
      <p class="font-label-caps text-[9px] uppercase text-outline tracking-widest">Navigation</p>
      <h2 class="font-display-lg text-2xl font-black text-white uppercase tracking-tight mt-1">Main Menu</h2>
    </div>

    <!-- Navigation cards — full-width 2×2 grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {#each menuItems as item}
        {@const isDebug = item.id === '04'}
        <button
          id="menu-{item.id}"
          onclick={item.action}
          class="tactical-panel p-6 group cursor-pointer text-left w-full
            hover:scale-105 transition-all duration-300
            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
            {isDebug ? 'hover:border-tertiary' : 'hover:border-primary'}"
          disabled={item.disabled?.() ?? false}
        >
          <div class="flex items-center justify-between mb-4">
            <span class="font-label-caps {isDebug ? 'text-tertiary' : 'text-primary'} text-xs">
              {item.id}
            </span>
            <span class="material-symbols-outlined {isDebug ? 'text-tertiary' : 'text-primary'}">
              {item.icon}
            </span>
          </div>

          <h3 class="font-headline-md text-lg font-black text-white uppercase tracking-tight
            {isDebug ? 'group-hover:text-tertiary' : 'group-hover:text-primary'} transition-colors">
            {item.label}
          </h3>

          <p class="text-sm text-on-surface-variant mt-2 leading-relaxed">{item.desc}</p>

          {#if item.id === '01' && !hasSave}
            <p class="text-xs text-outline mt-2 italic font-label-caps tracking-wide">No save file found.</p>
          {/if}

          {#if isDebug}
            <p class="font-label-caps text-[9px] uppercase text-tertiary/60 mt-3 tracking-widest">
              ⚠ Dev Access Required
            </p>
          {/if}
        </button>
      {/each}
    </div>

  </div>
</section>
