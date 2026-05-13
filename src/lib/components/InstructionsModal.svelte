<!-- src/lib/components/InstructionsModal.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { MAP_THEMES } from '$lib/core/map-themes.js';
  import type { BiomeId } from '$lib/core/types.js';

  type ManualEntry = {
    title: string;
    body: string;
    tip?: string;
  };

  interface Props {
    biome?: Exclude<BiomeId, 'shuffle'>;
  }

  let { biome = 'data_jungle' }: Props = $props();

  const dispatch = createEventDispatcher();

  const controls = [
    ['Move', 'WASD / Arrow Keys, or swipe on mobile'],
    ['Wall Bomb', 'Space, or tap on mobile'],
    ['Interact', 'E / Enter'],
    ['Pause', 'Esc / P'],
    ['Debug Overlay', 'F1'],
  ] as const;

  const items = [
    {
      title: 'Power Crystal',
      body: 'Temporarily lets you destroy enemies on contact and increases your fog vision radius.',
    },
    {
      title: 'Freeze Clock',
      body: 'Freezes all enemies for a short window. Use it to cross chokepoints or recover from a bad route.',
    },
    {
      title: 'Bomb Pickup',
      body: 'Adds one Wall Bomb, up to the current cap. Extra pickups can become bonus score.',
    },
  ] as const;

  const enemies = [
    ['Ghost', 'BFS', '#60a5fa', 'Finds the shortest route on a normal unweighted grid. It is direct and predictable.'],
    ['Heavy', 'Dijkstra', '#f97316', 'Accounts for terrain cost. It is slower, but keeps pressure on weighted maps.'],
    ['Hunter', 'A*', '#a855f7', 'Uses Manhattan distance to cut toward you quickly. Avoid long straight retreats.'],
    ['Shadow', 'DFS', '#9ca3af', 'Explores deep paths first. It is less optimal, but harder to read.'],
  ] as const;

  const mapObjects: Record<Exclude<BiomeId, 'shuffle'>, ManualEntry[]> = {
    data_jungle: [
      {
        title: 'Stealth Node',
        body: 'A glowing green tile that reduces enemy detection by 70% while you stand inside it.',
        tip: 'Use it to break line pressure before changing route.',
      },
      {
        title: 'Stealth Vines',
        body: 'The Data Jungle version of mud. Movement through it is slowed by 50%, and enemies are slowed too.',
        tip: 'Lead enemies through vines when you need a few extra beats.',
      },
      {
        title: 'Toxic Moss',
        body: 'The Data Jungle version of ice. Once you step onto it, you slide until something blocks you.',
        tip: 'Check the landing cell before moving, especially near dead ends.',
      },
      {
        title: 'Hardlight Bridge',
        body: 'A ladder-style shortcut that connects two floor tiles through a wall. Player and enemies can both use it.',
      },
      {
        title: 'Cyber-Spore Bloom',
        body: 'A 3x3 warning zone appears before detonation. If it catches you, your fog radius shrinks to 1 for 4 seconds.',
      },
    ],
    cooling_sea: [
      {
        title: 'Data Stream',
        body: 'Directional conveyor tiles. Moving with the arrow is faster; moving against it is slower.',
        tip: 'Pull enemies against the stream to stretch their path timing.',
      },
      {
        title: 'Deep Coolant',
        body: 'The Cooling Sea version of mud. It slows movement by 50% for both player and enemies.',
      },
      {
        title: 'Frozen Floor',
        body: 'The Cooling Sea version of ice. You slide in a straight line until blocked.',
        tip: 'Be careful when Frozen Floor points into Data Streams.',
      },
      {
        title: 'Ventilation Shaft',
        body: 'A stable ladder-style shortcut through walls. It does not collapse and is a reliable escape route.',
      },
      {
        title: 'Cryo-Geyser',
        body: 'A 3x3 warning zone detonates after a short delay. Units caught inside are frozen for a few seconds.',
        tip: 'It can freeze enemies too, so bait them into the zone when possible.',
      },
    ],
    lava_core: [
      {
        title: 'Volatile Sector',
        body: 'An unstable tile that erupts every 5 seconds. Standing on it during eruption is lethal.',
        tip: 'Enemies can also be destroyed by it, so it can become a trap.',
      },
      {
        title: 'Melted Slag',
        body: 'The Lava Core version of mud. It slows movement and can erupt during its heat cycle.',
      },
      {
        title: 'Scorched Glass',
        body: 'The Lava Core version of ice. It can slide you directly into Volatile Sectors if you rush.',
      },
      {
        title: 'Thermal Elevator',
        body: 'A ladder-style shortcut that can collapse after use and needs time to rebuild.',
        tip: 'Do not rely on one elevator as your only escape route.',
      },
      {
        title: 'Volatile Eruption',
        body: 'A 3x3 lava warning zone. If you are inside when it detonates, you die immediately.',
      },
    ],
  };

  const theme = $derived(MAP_THEMES[biome] ?? MAP_THEMES.data_jungle);
  const objects = $derived(mapObjects[biome] ?? mapObjects.data_jungle);

  function close() {
    dispatch('close');
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="overlay"
  role="dialog"
  aria-modal="true"
  aria-label="How to Play"
  tabindex="-1"
  style="--manual-accent: {theme.primaryColor}; --manual-accent-soft: {theme.primaryColor}33"
  onclick={close}
>
  <div class="modal-content" role="presentation" onclick={(e) => e.stopPropagation()}>
    <div class="modal-header">
      <div>
        <p class="eyebrow">{theme.label} BRIEFING</p>
        <h2 class="modal-title">How To Play</h2>
      </div>
      <button class="close-btn" aria-label="Close" onclick={close}>
        <span class="material-symbols-outlined" aria-hidden="true">close</span>
      </button>
    </div>

    <div class="modal-body">
      <section class="hero-grid">
        <article class="hero-card">
          <span class="material-symbols-outlined" aria-hidden="true">flag</span>
          <h3>Objective</h3>
          <p>Reach the EXIT before time runs out. Enemy contact costs one life; losing all lives ends the run.</p>
        </article>

        <article class="hero-card">
          <span class="material-symbols-outlined" aria-hidden="true">visibility</span>
          <h3>Fog of War</h3>
          <p>Your default vision radius is limited. Power Crystal expands vision, while some map hazards can reduce it.</p>
        </article>

        <article class="hero-card">
          <span class="material-symbols-outlined" aria-hidden="true">explosion</span>
          <h3>Wall Bombs</h3>
          <p>Use Wall Bombs to destroy nearby walls and open emergency routes. Keep one for dead ends when possible.</p>
        </article>
      </section>

      <div class="section-grid">
        <section class="info-section">
          <div class="section-title">
            <span class="material-symbols-outlined" aria-hidden="true">keyboard</span>
            <h3>Controls</h3>
          </div>

          <div class="control-list">
            {#each controls as [action, key]}
              <div class="control-row">
                <span>{action}</span>
                <strong>{key}</strong>
              </div>
            {/each}
          </div>
        </section>

        <section class="info-section">
          <div class="section-title">
            <span class="material-symbols-outlined" aria-hidden="true">deployed_code</span>
            <h3>Items</h3>
          </div>

          <div class="entry-list">
            {#each items as item}
              <article>
                <h4>{item.title}</h4>
                <p>{item.body}</p>
              </article>
            {/each}
          </div>
        </section>
      </div>

      <section class="info-section">
        <div class="section-title">
          <span class="material-symbols-outlined" aria-hidden="true">neurology</span>
          <h3>Enemy Algorithms</h3>
        </div>

        <div class="enemy-grid">
          {#each enemies as [name, algorithm, color, desc]}
            <article class="enemy-card" style="--enemy-color: {color}">
              <div class="enemy-head">
                <span class="enemy-dot"></span>
                <div>
                  <h4>{name}</h4>
                  <strong>{algorithm}</strong>
                </div>
              </div>
              <p>{desc}</p>
            </article>
          {/each}
        </div>
      </section>

      <section class="info-section">
        <div class="section-title">
          <span class="material-symbols-outlined" aria-hidden="true">map</span>
          <h3>{theme.label} Objects</h3>
        </div>

        <div class="map-object-list">
          {#each objects as object}
            <article class="map-object">
              <h4>{object.title}</h4>
              <p>{object.body}</p>
              {#if object.tip}
                <span>{object.tip}</span>
              {/if}
            </article>
          {/each}
        </div>
      </section>
    </div>

    <div class="modal-footer">
      <button class="btn btn-primary" onclick={close}>Got it</button>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background:
      radial-gradient(circle at 50% 22%, var(--manual-accent-soft), transparent 36%),
      rgba(0, 0, 0, 0.76);
    backdrop-filter: blur(14px);
    z-index: 100;
  }

  .modal-content {
    background:
      linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.018)),
      rgba(8, 10, 12, 0.96);
    border: 1px solid var(--manual-accent-soft);
    border-top: 3px solid var(--manual-accent);
    border-radius: 8px;
    width: min(980px, 100%);
    max-height: min(90vh, 860px);
    display: flex;
    flex-direction: column;
    box-shadow:
      0 26px 90px rgba(0, 0, 0, 0.84),
      0 0 36px var(--manual-accent-soft);
    font-family: 'Outfit', sans-serif;
    color: #fff;
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    padding: 22px 26px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .eyebrow {
    margin: 0 0 8px;
    color: var(--manual-accent);
    font: 900 10px 'JetBrains Mono', monospace;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  .modal-title {
    font-size: clamp(30px, 6vw, 52px);
    line-height: 0.92;
    font-weight: 900;
    text-transform: uppercase;
    margin: 0;
    letter-spacing: 0;
  }

  .close-btn {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.13);
    color: rgba(255, 255, 255, 0.64);
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
  }

  .close-btn:hover {
    color: #fff;
    border-color: var(--manual-accent);
    background: var(--manual-accent-soft);
  }

  .modal-body {
    padding: 22px 26px 26px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .hero-grid,
  .section-grid,
  .enemy-grid,
  .map-object-list {
    display: grid;
    gap: 12px;
  }

  .hero-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .section-grid {
    grid-template-columns: minmax(260px, 0.85fr) minmax(0, 1.15fr);
  }

  .enemy-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .map-object-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hero-card,
  .info-section,
  .enemy-card,
  .map-object {
    border: 1px solid rgba(255, 255, 255, 0.09);
    background: rgba(255, 255, 255, 0.035);
  }

  .hero-card {
    padding: 16px;
    border-left: 2px solid var(--manual-accent);
  }

  .hero-card .material-symbols-outlined {
    color: var(--manual-accent);
    font-size: 24px;
    margin-bottom: 12px;
  }

  .info-section {
    padding: 16px;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--manual-accent);
    margin-bottom: 14px;
  }

  .section-title .material-symbols-outlined {
    font-size: 22px;
  }

  h3,
  h4 {
    margin: 0;
    font-family: 'Outfit', sans-serif;
    text-transform: uppercase;
    letter-spacing: 0;
  }

  h3 {
    color: #fff;
    font-size: 16px;
    font-weight: 900;
  }

  h4 {
    color: #fff;
    font-size: 12px;
    font-weight: 900;
  }

  p {
    margin: 0;
    color: rgba(255, 255, 255, 0.62);
    font: 600 13px / 1.5 'Outfit', sans-serif;
  }

  .control-list,
  .entry-list {
    display: grid;
    gap: 9px;
  }

  .control-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding-bottom: 9px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
    color: rgba(255, 255, 255, 0.62);
    font: 800 11px 'Outfit', sans-serif;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .control-row:last-child {
    border-bottom: 0;
    padding-bottom: 0;
  }

  .control-row strong {
    color: #fff;
    font: 700 11px 'JetBrains Mono', monospace;
    text-align: right;
  }

  .entry-list article,
  .map-object {
    padding-left: 11px;
    border-left: 2px solid var(--manual-accent-soft);
  }

  .entry-list article {
    display: grid;
    gap: 4px;
  }

  .enemy-card {
    padding: 14px;
    border-top: 2px solid var(--enemy-color);
  }

  .enemy-head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .enemy-dot {
    width: 12px;
    height: 12px;
    background: var(--enemy-color);
    box-shadow: 0 0 14px var(--enemy-color);
  }

  .enemy-head strong {
    color: var(--enemy-color);
    font: 900 10px 'JetBrains Mono', monospace;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .map-object {
    display: grid;
    gap: 5px;
    padding: 13px;
  }

  .map-object span {
    color: var(--manual-accent);
    font: 800 11px / 1.45 'Outfit', sans-serif;
  }

  .modal-footer {
    padding: 18px 26px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    justify-content: flex-end;
  }

  .btn {
    min-height: 44px;
    padding: 0 24px;
    border-radius: 6px;
    border: none;
    font-family: 'Outfit', sans-serif;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    cursor: pointer;
    transition: filter 0.15s ease, transform 0.15s ease;
  }

  .btn:hover {
    filter: brightness(1.08);
    transform: translateY(-1px);
  }

  .btn-primary {
    background: var(--manual-accent);
    color: #020304;
  }

  .material-symbols-outlined {
    font-family: 'Material Symbols Outlined', sans-serif;
    font-variation-settings: 'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 24;
    line-height: 1;
    user-select: none;
  }

  @media (max-width: 860px) {
    .overlay {
      align-items: flex-end;
      padding: 14px;
    }

    .modal-content {
      max-height: 92vh;
    }

    .hero-grid,
    .section-grid,
    .enemy-grid,
    .map-object-list {
      grid-template-columns: 1fr;
    }

    .modal-header,
    .modal-body,
    .modal-footer {
      padding-left: 18px;
      padding-right: 18px;
    }

    .modal-footer {
      align-items: stretch;
      flex-direction: column;
    }
  }
</style>
