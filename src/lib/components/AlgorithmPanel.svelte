<!-- AlgorithmPanel.svelte — Debug overlay showing per-enemy pathfinding stats -->
<script lang="ts">
  import { gameState } from '$lib/stores/game-state.js';
  import { debugMode } from '$lib/stores/debug-store.js';
  import { ENEMY_COLORS, ENEMY_NAMES } from '$lib/entities/enemy.js';

  const enemies = $derived($gameState.enemies);
  const show = $derived($debugMode);
</script>

{#if show}
  <div class="algo-panel" role="complementary" aria-label="Algorithm debug panel">
    <div class="panel-header">
      <span class="panel-title">🔍 Algorithm Debug</span>
      <span class="panel-hint">F1 to hide</span>
    </div>

    {#each enemies as enemy (enemy.id)}
      {@const color = ENEMY_COLORS[enemy.algoType]}
      {@const name = ENEMY_NAMES[enemy.algoType]}
      {@const result = enemy.lastAlgoResult}
      <div class="enemy-card" style="--accent: {color}">
        <div class="card-header">
          <span class="enemy-dot" style="background:{color}; box-shadow: 0 0 6px {color}"></span>
          <span class="enemy-name">{name}</span>
          <span class="algo-badge">{enemy.algoType}</span>
          <span class="mode-badge" class:flee={enemy.mode === 'FLEE'}>
            {enemy.mode === 'FLEE' ? 'FLEE' : 'PURSUE'}
          </span>
        </div>
        {#if result}
          <div class="stats">
            <div class="stat">
              <span class="stat-label">Nodes expanded</span>
              <span class="stat-value">{result.visited.length}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Path length</span>
              <span class="stat-value">{result.path.length}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Compute time</span>
              <span class="stat-value">{result.computeMs.toFixed(2)} ms</span>
            </div>
          </div>
        {:else}
          <p class="no-data">No path computed yet</p>
        {/if}
      </div>
    {/each}

    {#if enemies.length === 0}
      <p class="no-enemies">No enemies on field</p>
    {/if}
  </div>
{/if}

<style>
  .algo-panel {
    position: absolute;
    top: 70px;
    right: 12px;
    width: 240px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 8px 12px;
  }

  .panel-title {
    font-size: 13px;
    font-weight: 700;
    color: #fff;
    font-family: 'Outfit', sans-serif;
  }

  .panel-hint {
    font-size: 10px;
    color: rgba(255,255,255,0.35);
  }

  .enemy-card {
    background: rgba(0,0,0,0.65);
    backdrop-filter: blur(8px);
    border: 1px solid var(--accent, rgba(255,255,255,0.1));
    border-radius: 10px;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .enemy-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .enemy-name {
    font-size: 13px;
    font-weight: 700;
    color: #fff;
    font-family: 'Outfit', sans-serif;
    flex: 1;
  }

  .algo-badge, .mode-badge {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.08em;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
  }

  .algo-badge {
    background: rgba(255,255,255,0.1);
    color: var(--accent, #fff);
  }

  .mode-badge {
    background: rgba(57,255,20,0.15);
    color: #39ff14;
  }

  .mode-badge.flee {
    background: rgba(247,37,133,0.2);
    color: #f72585;
  }

  .stats {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .stat {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .stat-label {
    font-size: 11px;
    color: rgba(255,255,255,0.45);
    font-family: sans-serif;
  }

  .stat-value {
    font-size: 11px;
    font-weight: 700;
    color: #fff;
    font-family: monospace;
  }

  .no-data, .no-enemies {
    font-size: 11px;
    color: rgba(255,255,255,0.3);
    text-align: center;
    font-family: sans-serif;
  }
</style>
