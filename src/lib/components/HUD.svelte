<!-- HUD.svelte — In-game heads-up display overlay (redesigned) -->
<script lang="ts">
  import { gameState } from '$lib/stores/game-state.js';
  import { goto } from '$app/navigation';

  let { onPause }: { onPause: () => void } = $props();

  // ── Reactive state từ store ──────────────────────────────────────────
  const state = $derived($gameState);

  /** Round hiện tại */
  const currentRound = $derived(state.round);

  /** Số lượng bomb còn lại */
  const bombsCount = $derived(state.player.wallBombs);

  /** Freeze có đang active không */
  const isFreezeActive = $derived(state.player.freezeTimer > 0);

  /** % thời gian Freeze còn lại (8s = 8000ms max) */
  const freezePct = $derived(
    isFreezeActive ? Math.min(100, (state.player.freezeTimer / 8000) * 100) : 0
  );

  /** Giây Freeze còn lại */
  const freezeSec = $derived(Math.ceil(state.player.freezeTimer / 1000));

  /** Crystal có đang active không */
  const isCrystalActive = $derived(state.player.powerUpTimer > 0);

  /** % thời gian Crystal còn lại (12s = 12000ms max) */
  const crystalPct = $derived(
    isCrystalActive ? Math.min(100, (state.player.powerUpTimer / 12000) * 100) : 0
  );

  /** Giây Crystal còn lại */
  const crystalSec = $derived(Math.ceil(state.player.powerUpTimer / 1000));

  /** Số mạng hiện tại */
  const currentLives = $derived(state.lives);

  /** Event log — lấy từ lastEventLabel của store, bổ sung log mẫu */
  const systemLogs: { time: string; msg: string; type: 'info' | 'error' | 'crystal' }[] = [
    { time: '12:43:55', msg: 'SYS_INIT SEC_OK',        type: 'info'    },
    { time: '12:43:58', msg: 'ALGORITHM: A* PATHING',  type: 'info'    },
    { time: '12:44:00', msg: 'ENTITY SCANNED.',         type: 'info'    },
    { time: '12:44:02', msg: 'GHOST AI DETECTED',       type: 'error'   },
    { time: '12:44:10', msg: 'CRYSTAL ENGAGED',         type: 'crystal' },
  ];

  /** Pad round number */
  function padRound(n: number) {
    return String(n).padStart(2, '0');
  }
</script>

<!--
  ╔══════════════════════════════════════════════════════╗
  ║  Layer stack (z-index)                               ║
  ║  z-0  : <canvas> — game renderer                    ║
  ║  z-10 : .scanlines / .vignette overlay               ║
  ║  z-20 : HUD (this component)                         ║
  ╚══════════════════════════════════════════════════════╝
-->

<!-- Scanlines & Vignette — pointer-events: none by CSS -->
<div class="absolute inset-0 z-10 scanlines vignette"></div>

<!-- Freeze Digital Glitch Vignette overlay -->
{#if isFreezeActive}
  <div class="absolute inset-0 z-15 pointer-events-none freeze-vignette transition-opacity duration-300"></div>
{/if}

<!-- ── Main HUD Container ─────────────────────────────────────────────── -->
<!-- pointer-events-none on the wrapper; children opt-in with pointer-events-auto -->
<div class="absolute inset-0 z-20 flex flex-col justify-between pointer-events-none p-margin hud-root"
     class:freeze-theme={isFreezeActive}>

  <!-- ═══════════════════════════════ HEADER ════════════════════════════ -->
  <div class="flex justify-between items-start pointer-events-auto">

    <!-- Left column: TopNavBar + Lives -->
    <div class="flex flex-col gap-4 hud-cluster-left">

      <!-- Top Nav Bar -->
      <nav class="bg-surface/80 backdrop-blur-md flex justify-between items-center
                  px-gutter py-2 rounded-DEFAULT border-b border-outline-variant
                  w-fit gap-8 pointer-events-auto hud-nav-top">

        <!-- Logo -->
        <div class="font-display-lg text-headline-md tracking-tighter
                    text-primary italic text-4xl font-extrabold">
          MAZE HUNTER
        </div>

        <!-- Phase / Round -->
        <div class="flex items-center gap-3 ml-4 pl-4 border-l border-outline-variant">
          <div class="font-label-caps text-label-caps text-on-surface-variant/60 tracking-widest">
            PHASE
          </div>
          <div class="font-data-lg text-primary text-xl tracking-wider
                      drop-shadow-[0_0_8px_rgba(78,222,163,0.6)]">
            ROUND {padRound(currentRound)}
          </div>
        </div>

        <!-- Action icons -->
        <div class="flex gap-4 items-center">
          <button
            class="material-symbols-outlined text-on-surface-variant hover:text-primary
                   cursor-pointer transition-colors bg-transparent border-none p-0"
            aria-label="Settings"
            onclick={() => {}}
          >settings</button>
          <button
            class="material-symbols-outlined text-on-surface-variant hover:text-primary
                   cursor-pointer transition-colors bg-transparent border-none p-0"
            aria-label="Pause game"
            onclick={onPause}
          >power_settings_new</button>
        </div>
      </nav>

      <!-- ── OPERATOR STATUS — Lives Widget ── -->
      <div class="glass-panel border border-primary/30 px-4 py-2 flex flex-col gap-1 w-fit rounded-lg">
        <div class="font-label-caps text-label-caps text-on-surface-variant/60 tracking-widest text-[10px]">
          OPERATOR STATUS
        </div>
        <div class="flex items-center gap-2">
          {#each Array(3) as _, i}
            {#if i < currentLives}
              <!-- Active life: glowing green block -->
              <div class="w-5 h-5 rounded-sm bg-primary shadow-[0_0_8px_theme('colors.primary')]
                          border border-primary/60 transition-all duration-300">
              </div>
            {:else}
              <!-- Lost life: dim block -->
              <div class="w-5 h-5 rounded-sm bg-surface-container-highest border border-outline-variant opacity-30">
              </div>
            {/if}
          {/each}
          <span class="font-data-sm text-on-surface-variant text-[11px] ml-1">
            {currentLives}/3
          </span>
        </div>
      </div>
    </div>

    <!-- Right column: Power-up badges -->
    <div class="flex flex-col items-end gap-4 hud-cluster-right">
      {#if isCrystalActive}
        <div class="glass-panel border border-primary/30 p-3 w-48 flex flex-col gap-2
                    rounded-lg animate-pulse">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-sm">diamond</span>
              <span class="font-label-caps text-[10px] text-primary tracking-widest">
                CRYSTAL ACTIVE
              </span>
            </div>
            <span class="font-data-sm text-on-surface font-bold text-xs">
              {crystalSec}s
            </span>
          </div>
          <!-- Progress bar -->
          <div class="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
            <div
              class="bg-primary h-full rounded-full shadow-[0_0_10px_theme('colors.primary')]
                     transition-[width] duration-100 ease-linear"
              style="width: {crystalPct}%"
            ></div>
          </div>
        </div>
      {/if}

      {#if isFreezeActive}
        <div class="glass-panel border border-primary/30 p-3 w-48 flex flex-col gap-2
                    rounded-lg animate-pulse">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-sm">ac_unit</span>
              <span class="font-label-caps text-[10px] text-primary tracking-widest">
                FREEZE ACTIVE
              </span>
            </div>
            <span class="font-data-sm text-on-surface font-bold text-xs">
              {freezeSec}s
            </span>
          </div>
          <!-- Progress bar -->
          <div class="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
            <div
              class="bg-primary h-full rounded-full shadow-[0_0_10px_theme('colors.primary')]
                     transition-[width] duration-100 ease-linear"
              style="width: {freezePct}%"
            ></div>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- ═══════════════════════════════ FOOTER ════════════════════════════ -->
  <div class="flex justify-between items-end pointer-events-auto">

    <!-- Left: Inventory Panels -->
    <div class="flex gap-4 hud-cluster-left">

      <!-- Wall Bombs -->
      <div class="glass-panel border border-outline-variant p-3 w-32 flex flex-col gap-2
                  hover:bg-surface-variant/30 cursor-pointer transition-colors group hud-inventory-card"
           role="button"
           tabindex="0"
           aria-label="Wall Bombs: {bombsCount} remaining">
        <div class="flex justify-between items-start">
          <span class="material-symbols-outlined text-primary group-hover:scale-110
                       transition-transform">bomb</span>
          <span class="font-data-sm text-data-sm text-on-surface-variant">
            {bombsCount}/5
          </span>
        </div>
        <div>
          <div class="font-label-caps text-label-caps text-on-surface">WALL BOMBS</div>
          <div class="font-data-sm text-data-sm text-on-surface-variant mt-1">[SPACE]</div>
        </div>
      </div>
    </div>

    <!-- Right: System Event Log -->
    <div class="glass-panel border border-outline-variant w-80 h-48 flex flex-col p-3 hud-cluster-right hud-event-log">
      <div class="font-label-caps text-label-caps text-on-surface-variant
                  border-b border-outline-variant pb-2 mb-2
                  flex justify-between items-center">
        <span>SYSTEM LOGS</span>
        <span class="material-symbols-outlined text-[14px]">terminal</span>
      </div>

      <div class="flex-1 overflow-y-auto flex flex-col gap-1 font-data-sm text-data-sm">
        {#each systemLogs as log}
          {#if log.type === 'error'}
            <div class="text-error bg-error-container/10 px-1 border-l-2 border-error">
              <span class="text-error/70">[{log.time}]</span>
              {log.msg}
            </div>
          {:else if log.type === 'crystal'}
            <div class="text-primary bg-primary/10 px-1 border-l-2 border-primary mt-1">
              <span class="text-primary/70">[{log.time}]</span>
              {log.msg}
            </div>
          {:else}
            <div class="text-on-surface-variant">
              <span class="text-outline">[{log.time}]</span>
              {log.msg}
            </div>
          {/if}
        {/each}

        <!-- Dynamic last event from game store -->
        {#if state.lastEventLabel}
          <div class="text-secondary bg-secondary/10 px-1 border-l-2 border-secondary mt-1">
            <span class="text-secondary/70">[LIVE]</span>
            {state.lastEventLabel}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  /* ── Scanlines effect ────────────────────────────────────────────────── */
  .scanlines {
    background: linear-gradient(
      to bottom,
      rgba(255,255,255,0),
      rgba(255,255,255,0) 50%,
      rgba(0,0,0,0.2) 50%,
      rgba(0,0,0,0.2)
    );
    background-size: 100% 4px;
    pointer-events: none;
  }

  /* ── Vignette effect ─────────────────────────────────────────────────── */
  .vignette {
    box-shadow: inset 0 0 150px rgba(0,0,0,0.9);
    pointer-events: none;
  }

  /* ── Freeze Digital Glitch Vignette ──────────────────────────────────── */
  .freeze-vignette {
    box-shadow: inset 0 0 120px rgba(34, 211, 238, 0.4),
                inset 0 0 20px rgba(34, 211, 238, 0.8);
    border: 2px solid rgba(34, 211, 238, 0.3);
    mix-blend-mode: screen;
    pointer-events: none;
  }

  /* ── Freeze Theme Override ───────────────────────────────────────────── */
  .freeze-theme {
    /* Override primary color to cyan-400 (#22d3ee) */
    --color-primary: #22d3ee;
  }

  /* ── Glass panel ─────────────────────────────────────────────────────── */
  .glass-panel {
    background-color: rgba(10, 10, 12, 0.6);
    backdrop-filter: blur(8px);
  }

  /* ── Material Symbols icon font ──────────────────────────────────────── */
  .material-symbols-outlined {
    font-family: 'Material Symbols Outlined', sans-serif;
    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    font-size: 24px;
    line-height: 1;
    display: inline-block;
    vertical-align: middle;
    user-select: none;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     3D HOLOGRAM / COCKPIT VISOR — CSS 3D Transforms
     Perspective is set on .hud-root so all child transforms share the
     same vanishing point, simulating a curved heads-up display.
  ═══════════════════════════════════════════════════════════════════════ */

  /* 1. Perspective container — the "cockpit visor" viewport */
  .hud-root {
    perspective: 1200px;
    perspective-origin: 50% 38%; /* Slightly above center = natural eye line */
  }

  /* 2. LEFT clusters — tilt inward from the left edge (positive rotateY) */
  .hud-cluster-left {
    transform-style: preserve-3d;
    transform: rotateY(12deg) rotateX(5deg);
    transform-origin: left center;
    /* Neon cyan drop-shadow — simulates light emitting from a floating panel */
    filter: drop-shadow(-4px 6px 18px rgba(78, 222, 163, 0.35))
            drop-shadow(0px 0px 6px rgba(78, 222, 163, 0.15));
    transition: filter 0.3s ease;
  }
  .hud-cluster-left:hover {
    filter: drop-shadow(-4px 6px 24px rgba(78, 222, 163, 0.55))
            drop-shadow(0px 0px 10px rgba(78, 222, 163, 0.25));
  }

  /* 3. RIGHT clusters — mirror of left (negative rotateY) */
  .hud-cluster-right {
    transform-style: preserve-3d;
    transform: rotateY(-12deg) rotateX(5deg);
    transform-origin: right center;
    filter: drop-shadow(4px 6px 18px rgba(78, 222, 163, 0.35))
            drop-shadow(0px 0px 6px rgba(78, 222, 163, 0.15));
    transition: filter 0.3s ease;
  }
  .hud-cluster-right:hover {
    filter: drop-shadow(4px 6px 24px rgba(78, 222, 163, 0.55))
            drop-shadow(0px 0px 10px rgba(78, 222, 163, 0.25));
  }

  /* 4. TOP nav — tilt backward along X axis (top edge recedes from viewer) */
  .hud-nav-top {
    transform-style: preserve-3d;
    transform: rotateX(-8deg);
    transform-origin: center top;
    filter: drop-shadow(0px 8px 20px rgba(78, 222, 163, 0.4))
            drop-shadow(0px 0px 4px rgba(78, 222, 163, 0.2));
  }

  /* 5. Inventory cards — translateZ lift on hover ("pop toward viewer") */
  .hud-inventory-card {
    transform-style: preserve-3d;
    /* Base: sits slightly recessed in the 3D plane */
    transform: translateZ(0px);
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
                box-shadow 0.3s ease,
                filter 0.3s ease;
    /* Subtle neon ambient glow at rest */
    box-shadow: 0 4px 24px rgba(78, 222, 163, 0.12),
                0 1px 4px rgba(0, 0, 0, 0.6),
                inset 0 0 0 1px rgba(78, 222, 163, 0.08);
  }
  .hud-inventory-card:hover {
    /* Pop 20px toward the viewer in the 3D scene */
    transform: translateZ(20px);
    box-shadow: 0 12px 40px rgba(78, 222, 163, 0.35),
                0 4px 12px rgba(0, 0, 0, 0.8),
                inset 0 0 0 1px rgba(78, 222, 163, 0.25);
    filter: brightness(1.15);
  }

  /* 6. Event log — matching right-cluster floating effect */
  .hud-event-log {
    box-shadow: 0 4px 24px rgba(78, 222, 163, 0.12),
                0 1px 4px rgba(0, 0, 0, 0.6);
    transition: box-shadow 0.3s ease;
  }
  .hud-event-log:hover {
    box-shadow: 0 8px 32px rgba(78, 222, 163, 0.28),
                0 2px 8px rgba(0, 0, 0, 0.7);
  }
</style>
