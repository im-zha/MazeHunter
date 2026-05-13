<!-- FieldManualModal.svelte - Main menu survival reference -->
<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  const protocols = [
    {
      icon: 'flag',
      title: 'Objective',
      body: 'Reach the EXIT before the timer expires. Enemy contact costs one life; losing all lives ends the run.',
    },
    {
      icon: 'visibility',
      title: 'Fog of War',
      body: 'Your vision is limited. Power Crystal expands sight range, so use it to scout exits and enemy routes.',
    },
    {
      icon: 'explosion',
      title: 'Wall Bombs',
      body: 'Press Space to break a nearby wall. Save at least one bomb for dead ends or emergency escapes.',
    },
  ] as const;

  const controls = [
    ['Move', 'WASD / Arrow Keys'],
    ['Wall Bomb', 'Space'],
    ['Interact', 'E / Enter'],
    ['Pause', 'Esc / P'],
    ['Debug Overlay', 'F1'],
  ] as const;

  const enemies = [
    ['Ghost', 'BFS', '#60a5fa', 'Shortest path on an unweighted grid. Predictable but direct.'],
    ['Heavy', 'Dijkstra', '#f97316', 'Reads terrain cost. Slower, but hard to shake on weighted maps.'],
    ['Hunter', 'A*', '#a855f7', 'Uses Manhattan heuristic. Fastest at cutting toward your position.'],
    ['Shadow', 'DFS', '#9ca3af', 'Explores deep routes first. Less optimal, more erratic.'],
  ] as const;

  const pickups = [
    ['Power Crystal', 'Destroy enemies on contact for a short time and increase vision.'],
    ['Freeze Clock', 'Freezes all enemies long enough to reposition or extract.'],
    ['Bomb Pickup', 'Adds one wall bomb, capped at five. Extra pickups can award score.'],
  ] as const;

  const tactics = [
    'Watch the enemy color before choosing a route: Hunter and Ghost punish straight lines.',
    'Use ladders and terrain to force enemies through slower or longer paths.',
    'When powered up, chase only nearby enemies; the timer is still the real threat.',
    'On ice, plan the landing cell before moving. Sliding into hazards is usually unrecoverable.',
  ] as const;

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') onClose();
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="manual-overlay"
  role="dialog"
  aria-modal="true"
  aria-labelledby="field-manual-title"
  tabindex="-1"
  onclick={(event) => {
    if (event.target === event.currentTarget) onClose();
  }}
  onkeydown={handleKeydown}
>
  <section class="manual-shell">
    <header class="manual-header">
      <div>
        <p class="manual-eyebrow">TACTICAL REFERENCE</p>
        <h2 id="field-manual-title">Field Manual</h2>
        <p class="manual-subtitle">Survival notes for movement, hazards, enemy AI, and extraction.</p>
      </div>

      <button class="close-button" type="button" aria-label="Close Field Manual" onclick={onClose}>
        <span class="material-symbols-outlined" aria-hidden="true">close</span>
      </button>
    </header>

    <div class="manual-body">
      <section class="protocol-grid" aria-label="Core protocols">
        {#each protocols as item}
          <article class="protocol-card">
            <span class="material-symbols-outlined protocol-icon" aria-hidden="true">{item.icon}</span>
            <div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          </article>
        {/each}
      </section>

      <div class="manual-columns">
        <section class="manual-panel">
          <div class="panel-heading">
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

        <section class="manual-panel">
          <div class="panel-heading">
            <span class="material-symbols-outlined" aria-hidden="true">deployed_code</span>
            <h3>Items</h3>
          </div>
          <div class="compact-list">
            {#each pickups as [name, desc]}
              <article>
                <h4>{name}</h4>
                <p>{desc}</p>
              </article>
            {/each}
          </div>
        </section>
      </div>

      <section class="manual-panel">
        <div class="panel-heading">
          <span class="material-symbols-outlined" aria-hidden="true">neurology</span>
          <h3>Enemy Algorithms</h3>
        </div>
        <div class="enemy-grid">
          {#each enemies as [name, algorithm, color, desc]}
            <article class="enemy-card" style="--enemy-color: {color}">
              <div class="enemy-top">
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

      <section class="manual-panel tactics-panel">
        <div class="panel-heading">
          <span class="material-symbols-outlined" aria-hidden="true">military_tech</span>
          <h3>Survival Tactics</h3>
        </div>
        <ol class="tactic-list">
          {#each tactics as tactic}
            <li>{tactic}</li>
          {/each}
        </ol>
      </section>
    </div>

    <footer class="manual-footer">
      <span>Operator note: escape routes beat perfect routes when the clock is bleeding.</span>
      <button type="button" onclick={onClose}>READY</button>
    </footer>
  </section>
</div>

<style>
  .manual-overlay {
    position: fixed;
    inset: 0;
    z-index: 80;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background:
      radial-gradient(circle at 50% 18%, rgba(216, 165, 104, 0.12), transparent 38%),
      rgba(0, 0, 0, 0.78);
    backdrop-filter: blur(16px);
    color: #fff;
  }

  .manual-shell {
    width: min(1080px, 100%);
    max-height: min(88vh, 860px);
    display: flex;
    flex-direction: column;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.015)),
      rgba(10, 12, 14, 0.98);
    border: 1px solid rgba(216, 165, 104, 0.34);
    border-top: 3px solid #d8a568;
    box-shadow:
      0 28px 90px rgba(0, 0, 0, 0.78),
      0 0 42px rgba(216, 165, 104, 0.12);
    overflow: hidden;
    animation: manual-in 0.22s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  @keyframes manual-in {
    from { opacity: 0; transform: translateY(14px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .manual-header,
  .manual-footer {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 22px 26px;
    border-color: rgba(255, 255, 255, 0.08);
  }

  .manual-header {
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .manual-footer {
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .manual-eyebrow {
    margin: 0 0 7px;
    color: #d8a568;
    font: 900 10px 'JetBrains Mono', monospace;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  h2 {
    margin: 0;
    font: 900 clamp(34px, 7vw, 64px) / 0.9 'Outfit', sans-serif;
    text-transform: uppercase;
    letter-spacing: 0;
  }

  .manual-subtitle,
  .manual-footer span,
  p {
    margin: 0;
    color: rgba(255, 255, 255, 0.58);
    font: 600 13px / 1.55 'Outfit', sans-serif;
  }

  .manual-subtitle {
    margin-top: 10px;
  }

  .close-button {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border: 1px solid rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.04);
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    transition: border-color 0.16s ease, color 0.16s ease, background 0.16s ease;
  }

  .close-button:hover {
    border-color: #d8a568;
    color: #fff;
    background: rgba(216, 165, 104, 0.09);
  }

  .manual-body {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    padding: 22px 26px 26px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .protocol-grid,
  .manual-columns,
  .enemy-grid {
    display: grid;
    gap: 12px;
  }

  .protocol-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .manual-columns {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .enemy-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .protocol-card,
  .manual-panel,
  .enemy-card {
    border: 1px solid rgba(255, 255, 255, 0.09);
    background: rgba(255, 255, 255, 0.035);
  }

  .protocol-card {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 14px;
    padding: 16px;
    border-left: 2px solid #d8a568;
  }

  .protocol-icon {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    color: #d8a568;
    background: rgba(216, 165, 104, 0.08);
    border: 1px solid rgba(216, 165, 104, 0.25);
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
    font-size: 17px;
    font-weight: 900;
  }

  h4 {
    color: #fff;
    font-size: 12px;
    font-weight: 900;
  }

  .manual-panel {
    padding: 16px;
  }

  .panel-heading {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
    color: #d8a568;
  }

  .panel-heading .material-symbols-outlined {
    font-size: 22px;
  }

  .control-list,
  .compact-list,
  .tactic-list {
    display: grid;
    gap: 9px;
  }

  .control-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    min-height: 34px;
    padding-bottom: 9px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
    color: rgba(255, 255, 255, 0.62);
    font: 800 11px 'Outfit', sans-serif;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .control-row:last-child {
    padding-bottom: 0;
    border-bottom: 0;
  }

  .control-row strong {
    color: #fff;
    font: 700 11px 'JetBrains Mono', monospace;
    text-align: right;
  }

  .compact-list article {
    padding-left: 11px;
    border-left: 2px solid rgba(216, 165, 104, 0.36);
  }

  .enemy-card {
    padding: 14px;
    border-top: 2px solid var(--enemy-color);
  }

  .enemy-top {
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

  .enemy-top strong {
    color: var(--enemy-color);
    font: 900 10px 'JetBrains Mono', monospace;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .tactic-list li {
    color: rgba(255, 255, 255, 0.62);
    font: 600 13px / 1.45 'Outfit', sans-serif;
  }

  .tactic-list {
    margin: 0;
    padding-left: 22px;
  }

  .tactics-panel {
    border-bottom: 2px solid rgba(78, 222, 163, 0.3);
  }

  .manual-footer button {
    min-height: 42px;
    padding: 0 24px;
    border: 1px solid #d8a568;
    background: #d8a568;
    color: #090b0d;
    font: 900 12px 'Outfit', sans-serif;
    letter-spacing: 0.14em;
    cursor: pointer;
  }

  .manual-footer button:hover {
    filter: brightness(1.08);
  }

  @media (max-width: 860px) {
    .manual-overlay {
      align-items: flex-end;
      padding: 14px;
    }

    .manual-shell {
      max-height: 92vh;
    }

    .protocol-grid,
    .manual-columns,
    .enemy-grid {
      grid-template-columns: 1fr;
    }

    .manual-header,
    .manual-footer,
    .manual-body {
      padding-left: 18px;
      padding-right: 18px;
    }

    .manual-footer {
      align-items: stretch;
      flex-direction: column;
    }
  }
</style>
