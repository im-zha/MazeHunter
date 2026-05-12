<!-- LandingHeader.svelte — Fixed HUD nav bar + Command Center sidebar -->
<script lang="ts">
  import { onMount } from 'svelte';

  // ── System Status animation ────────────────────────────────────────────────
  let statusText  = $state('Initializing...');
  let statusColor = $state('text-secondary');
  let isOnline    = $state(false);

  onMount(() => {
    setTimeout(() => { statusText = 'Syncing Data...'; }, 800);
    setTimeout(() => {
      statusText  = 'Online / No Breach';
      statusColor = 'text-primary';
      isOnline    = true;
    }, 2200);
  });

  // ── Sidebar state ─────────────────────────────────────────────────────────
  let sidebarOpen = $state(false);
  let activeTab   = $state<'settings' | 'sysinfo' | 'debug'>('settings');

  // Settings
  let sfxVolume  = $state(70);
  let bgmVolume  = $state(50);
  let scanlines  = $state(true);

  // Debug toggles
  let showAIPaths   = $state(false);
  let disableFog    = $state(false);
  let invincibility = $state(false);

  const tabs = [
    { id: 'settings' as const, label: 'Settings',     icon: 'tune'          },
    { id: 'sysinfo'  as const, label: 'System Info',  icon: 'memory'        },
    { id: 'debug'    as const, label: 'Debug Console', icon: 'bug_report'   },
  ];

  const sysRows = [
    ['Framework',    'SvelteKit 2.0'  ],
    ['Language',     'TypeScript 5.3' ],
    ['Core Engine',  'MazeGen-V4'     ],
    ['Build ID',     'MH-992-ALPHA'   ],
    ['Render',       'Canvas 2D'      ],
    ['AI Modules',   'BFS/Dijkstra/A*/DFS'],
  ] as const;
</script>

<!-- ═══ HEADER ════════════════════════════════════════════════════════════ -->
<header class="fixed top-0 left-0 w-full z-50 px-margin py-6 flex justify-between items-start pointer-events-none">

  <!-- Logo -->
  <div class="pointer-events-auto">
    <div class="flex items-center gap-3 border-l-2 border-primary pl-4">
      <div class="text-primary">
        <span class="material-symbols-outlined" style="font-size: 32px;">terminal</span>
      </div>
      <div>
        <h1 class="font-display-lg font-black text-xl tracking-tighter leading-none text-white">MAZE HUNTER</h1>
        <p class="font-label-caps text-[10px] text-primary opacity-80 uppercase">Tactical Interface v1.0.4</p>
      </div>
    </div>
  </div>

  <!-- Status + Command Center trigger -->
  <div class="pointer-events-auto flex flex-col items-end gap-2">
    <div class="tactical-panel px-4 py-2 flex items-center gap-6">
      <div class="flex flex-col items-end transition-all duration-500">
        <span class="font-label-caps text-[9px] uppercase text-outline">System Status</span>
        <span class="{statusColor} font-bold text-[11px] uppercase tracking-wider {isOnline ? '' : 'animate-pulse'}">
          {statusText}
        </span>
      </div>
      <div class="w-px h-6 bg-outline-variant"></div>
      <!-- Menu button → opens sidebar -->
      <button
        id="sidebar-open-btn"
        onclick={() => (sidebarOpen = true)}
        class="text-on-surface hover:text-primary transition-colors"
        aria-label="Open Command Center"
        aria-expanded={sidebarOpen}
      >
        <span class="material-symbols-outlined">menu</span>
      </button>
    </div>
  </div>
</header>

<!-- ═══ COMMAND CENTER SIDEBAR ════════════════════════════════════════════ -->
{#if sidebarOpen}
  <!-- Backdrop -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-60 bg-background/60 backdrop-blur-sm"
    onclick={() => (sidebarOpen = false)}
    onkeydown={(e) => e.key === 'Escape' && (sidebarOpen = false)}
    role="presentation"
  ></div>

  <!-- Panel -->
  <aside
    class="fixed top-0 right-0 h-full w-80 z-70 flex flex-col sidebar-slide-in"
    style="background: rgba(14,14,16,0.97); border-left: 1px solid rgba(134,148,138,0.2); backdrop-filter: blur(16px);"
    aria-label="Command Center"
  >
    <!-- Sidebar header -->
    <div class="flex items-center justify-between px-6 py-5 border-b border-outline-variant/30">
      <div>
        <p class="font-label-caps text-[9px] uppercase text-outline tracking-widest">Tactical Interface</p>
        <h2 class="font-display-lg font-black text-white text-base uppercase tracking-tight">Command Center</h2>
      </div>
      <button
        id="sidebar-close-btn"
        onclick={() => (sidebarOpen = false)}
        class="text-outline hover:text-white transition-colors"
        aria-label="Close sidebar"
      >
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>

    <!-- Tab bar -->
    <div class="flex border-b border-outline-variant/30">
      {#each tabs as tab}
        <button
          role="tab"
          id="sidebar-tab-{tab.id}"
          onclick={() => (activeTab = tab.id)}
          class="flex-1 py-3 flex flex-col items-center gap-0.5 transition-colors
            {activeTab === tab.id
              ? 'text-primary border-b-2 border-primary bg-primary/5'
              : 'text-outline hover:text-on-surface border-b-2 border-transparent'}"
          aria-selected={activeTab === tab.id}
        >
          <span class="material-symbols-outlined text-[18px]">{tab.icon}</span>
          <span class="font-label-caps text-[8px] uppercase tracking-widest">{tab.label}</span>
        </button>
      {/each}
    </div>

    <!-- Tab content (scrollable) -->
    <div class="flex-1 overflow-y-auto px-6 py-6 space-y-6">

      <!-- ── SETTINGS tab ─────────────────────────────────────────────── -->
      {#if activeTab === 'settings'}
        <!-- Audio -->
        <div>
          <p class="font-label-caps text-[9px] uppercase text-primary tracking-widest mb-4">Audio</p>
          <div class="space-y-4">
            <div>
              <div class="flex justify-between mb-1">
                <span class="font-label-caps text-[10px] uppercase text-on-surface-variant">SFX Volume</span>
                <span class="font-data-sm text-[10px] text-white">{sfxVolume}%</span>
              </div>
              <input
                type="range" min="0" max="100"
                bind:value={sfxVolume}
                class="w-full accent-primary h-1 cursor-pointer"
                aria-label="SFX volume"
              />
            </div>
            <div>
              <div class="flex justify-between mb-1">
                <span class="font-label-caps text-[10px] uppercase text-on-surface-variant">BGM Volume</span>
                <span class="font-data-sm text-[10px] text-white">{bgmVolume}%</span>
              </div>
              <input
                type="range" min="0" max="100"
                bind:value={bgmVolume}
                class="w-full accent-primary h-1 cursor-pointer"
                aria-label="BGM volume"
              />
            </div>
          </div>
        </div>

        <div class="w-full h-px bg-outline-variant/30"></div>

        <!-- Visuals -->
        <div>
          <p class="font-label-caps text-[9px] uppercase text-primary tracking-widest mb-4">Visuals</p>
          <div class="flex items-center justify-between">
            <div>
              <p class="font-label-caps text-[10px] uppercase text-on-surface-variant">Scanlines</p>
              <p class="text-[10px] text-outline mt-0.5">CRT overlay effect</p>
            </div>
            <button
              role="switch"
              aria-label="Toggle Scanlines"
              aria-checked={scanlines}
              onclick={() => (scanlines = !scanlines)}
              class="relative w-10 h-5 rounded-full transition-colors {scanlines ? 'bg-primary' : 'bg-outline-variant'}"
            >
              <span
                class="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform {scanlines ? 'translate-x-5' : 'translate-x-0.5'}"
              ></span>
            </button>
          </div>
        </div>

      <!-- ── SYSTEM INFO tab ────────────────────────────────────────────── -->
      {:else if activeTab === 'sysinfo'}
        <div>
          <p class="font-label-caps text-[9px] uppercase text-primary tracking-widest mb-4">Build Information</p>
          <div class="space-y-3 font-data-sm text-[11px]">
            {#each sysRows as [k, v]}
              <div class="flex justify-between border-b border-outline-variant/40 pb-2">
                <span class="text-outline uppercase">{k}</span>
                <span class="text-white">{v}</span>
              </div>
            {/each}
          </div>
        </div>

        <div class="p-3 bg-secondary/10 border border-secondary/20">
          <p class="text-secondary leading-tight italic text-[10px]">
            Warning: Debug Mode is currently enabled. System performance may fluctuate
            during recursive pathfinding operations.
          </p>
        </div>

        <div class="p-3 bg-primary/5 border border-primary/20">
          <p class="font-label-caps text-[9px] uppercase text-primary tracking-widest mb-1">Build Status</p>
          <div class="flex items-center gap-2">
            <div class="size-2 bg-primary rounded-full animate-pulse"></div>
            <span class="font-data-sm text-[10px] text-white">STABLE — All modules nominal</span>
          </div>
        </div>

      <!-- ── DEBUG CONSOLE tab ──────────────────────────────────────────── -->
      {:else if activeTab === 'debug'}
        <div class="p-3 bg-tertiary/10 border border-tertiary/30 mb-2">
          <p class="font-label-caps text-[9px] uppercase text-tertiary tracking-widest">⚠ Developer Only</p>
          <p class="text-[10px] text-on-surface-variant mt-0.5">
            These flags affect gameplay simulation. Use for testing only.
          </p>
        </div>

        {#each [
          { id: 'ai-paths',      label: 'Show AI Paths',  desc: 'Render pathfinding overlays on canvas', bind_key: 'showAIPaths'   },
          { id: 'disable-fog',   label: 'Disable Fog',    desc: 'Full visibility — no fog of war',        bind_key: 'disableFog'    },
          { id: 'invincibility', label: 'Invincibility',  desc: 'Player takes no damage',                 bind_key: 'invincibility' },
        ] as toggle}
          {@const isOn = toggle.bind_key === 'showAIPaths' ? showAIPaths : toggle.bind_key === 'disableFog' ? disableFog : invincibility}
          <div class="flex items-center justify-between py-3 border-b border-outline-variant/30">
            <div>
              <p class="font-label-caps text-[10px] uppercase text-on-surface-variant">{toggle.label}</p>
              <p class="text-[10px] text-outline mt-0.5">{toggle.desc}</p>
            </div>
            <button
              id="debug-{toggle.id}"
              role="switch"
              aria-label="Toggle {toggle.label}"
              aria-checked={isOn}
              onclick={() => {
                if (toggle.bind_key === 'showAIPaths')   showAIPaths   = !showAIPaths;
                if (toggle.bind_key === 'disableFog')    disableFog    = !disableFog;
                if (toggle.bind_key === 'invincibility') invincibility = !invincibility;
              }}
              class="relative w-10 h-5 rounded-full transition-colors {isOn ? 'bg-tertiary' : 'bg-outline-variant'}"
            >
              <span
                class="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform {isOn ? 'translate-x-5' : 'translate-x-0.5'}"
              ></span>
            </button>
          </div>
        {/each}
      {/if}
    </div>

    <!-- Sidebar footer -->
    <div class="px-6 py-4 border-t border-outline-variant/30">
      <p class="font-data-sm text-[9px] text-outline uppercase tracking-widest text-center">
        Maze Hunter Tactical Command © 2024
      </p>
    </div>
  </aside>
{/if}

<style>
  @keyframes sidebar-slide {
    from { transform: translateX(100%); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }
  .sidebar-slide-in {
    animation: sidebar-slide 0.25s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  input[type='range'] {
    -webkit-appearance: none;
    appearance: none;
    background: rgba(134, 148, 138, 0.25);
    border-radius: 0;
    height: 2px;
  }
  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    background: #4edea3;
    border-radius: 0;
    cursor: pointer;
  }
</style>
