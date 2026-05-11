<!-- MainMenuSection.svelte — Tactical menu grid + tech specs widget -->
<script lang="ts">
  interface MenuItem {
    id: string;
    icon: string;
    iconFill: boolean;
    label: string;
    desc: string;
    action: () => void;
    disabled?: () => boolean;
  }

  interface Props {
    hasSave: boolean;
    onNewGame: () => void;
    onContinue: () => void;
    onEndless: () => void;
  }
  let { hasSave, onNewGame, onContinue, onEndless }: Props = $props();

  const menuItems: MenuItem[] = [
    {
      id: '01',
      icon: 'play_arrow',
      iconFill: true,
      label: 'New Game',
      desc: 'Initialize new sequence generation.',
      action: () => onNewGame(),
    },
    {
      id: '02',
      icon: 'history',
      iconFill: false,
      label: 'Continue',
      desc: 'Resume active infiltration at Sector 7.',
      action: () => onContinue(),
      disabled: () => !hasSave,
    },
    {
      id: '03',
      icon: 'all_inclusive',
      iconFill: false,
      label: 'Endless Mode',
      desc: 'Test survival limits in infinite loops.',
      action: () => onEndless(),
    },
    {
      id: '04',
      icon: 'leaderboard',
      iconFill: false,
      label: 'Leaderboards',
      desc: 'Global efficiency rankings.',
      action: () => {},
    },
  ];
</script>

<section class="py-20 bg-surface-container-lowest border-y border-outline-variant/30">
  <div class="container mx-auto px-margin">
    <div class="grid grid-cols-1 md:grid-cols-12 gap-8">

      <!-- Navigation cards -->
      <div class="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {#each menuItems as item}
          <button
            id="menu-{item.id}"
            onclick={item.action}
            class="tactical-panel p-6 group cursor-pointer hover:border-primary transition-all text-left w-full"
            disabled={item.disabled?.() ?? false}
          >
            <div class="flex items-center justify-between mb-4">
              <span class="font-label-caps text-primary text-xs">{item.id}</span>
              <span
                class="material-symbols-outlined text-primary"
                style={item.iconFill ? "font-variation-settings:'FILL' 1;" : ''}
              >{item.icon}</span>
            </div>
            <h3 class="font-headline-md text-white group-hover:text-primary transition-colors text-lg font-bold">
              {item.label}
            </h3>
            <p class="text-sm text-on-surface-variant mt-2">{item.desc}</p>
            {#if item.id === '02' && !hasSave}
              <p class="text-xs text-outline mt-1 italic">No save found.</p>
            {/if}
          </button>
        {/each}
      </div>

      <!-- Technical Specs Widget -->
      <div class="md:col-span-4 flex flex-col gap-4">
        <div class="tactical-panel p-6 border-l-4 border-l-secondary">
          <div class="flex items-center gap-2 mb-6">
            <span class="material-symbols-outlined text-secondary">memory</span>
            <h2 class="font-label-caps text-sm text-secondary uppercase font-bold">Technical Specs</h2>
          </div>
          <div class="space-y-4 font-data-sm text-[11px]">
            {#each [['Framework','SvelteKit 2.0'],['Language','TypeScript 5.3'],['Core Engine','MazeGen-V4'],['Build ID','MH-992-ALPHA']] as [k, v]}
              <div class="flex justify-between border-b border-outline-variant pb-2">
                <span class="text-outline uppercase">{k}</span>
                <span class="text-white">{v}</span>
              </div>
            {/each}
            <div class="mt-6 p-3 bg-secondary/10 border border-secondary/20">
              <p class="text-secondary leading-tight italic text-[11px]">
                Warning: Debug Mode is currently enabled. System performance may fluctuate
                during recursive pathfinding operations.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</section>
