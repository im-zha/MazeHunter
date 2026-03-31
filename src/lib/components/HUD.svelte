<!-- HUD.svelte — In-game heads-up display overlay -->
<script lang="ts">
  import { gameState } from '$lib/stores/game-state.js';

  let { onPause }: { onPause: () => void } = $props();

  const HEART = '❤';
  const BOMB = '💣';

  const state = $derived($gameState);
  const powerUpPct = $derived(
    state.player.powerUpTimer > 0
      ? (state.player.powerUpTimer / 12000) * 100
      : 0
  );

  const freezePct = $derived(
    state.player.freezeTimer > 0
      ? (state.player.freezeTimer / 8000) * 100
      : 0
  );
</script>

<div class="hud pointer-events-none select-none">
  <!-- Top Bar -->
  <div class="hud-top">
    <!-- Score -->
    <div class="hud-block">
      <span class="hud-label">SCORE</span>
      <span class="hud-value score-value">{state.score.toLocaleString()}</span>
    </div>

    <!-- Wave -->
    <div class="hud-block hud-center">
      <span class="hud-label">WAVE</span>
      <span class="hud-value wave-value">{state.wave}</span>
    </div>

    <!-- Lives -->
    <div class="hud-block hud-right">
      <span class="hud-label">LIVES</span>
      <span class="hud-value">
        {#each Array(state.lives) as _}
          <span class="heart">{HEART}</span>
        {/each}
        {#each Array(Math.max(0, 3 - state.lives)) as _}
          <span class="heart dead">{HEART}</span>
        {/each}
      </span>
    </div>

    <!-- Pause Button -->
    <div class="hud-block hud-right-most pointer-events-auto">
      <button class="icon-btn" aria-label="Pause button" onclick={onPause}>⏸</button>
    </div>
  </div>

  <!-- Bottom Bar -->
  <div class="hud-bottom">
    <!-- Wall Bombs -->
    <div class="hud-block">
      <span class="hud-label">WALL BOMBS</span>
      <span class="hud-value">
        {#each Array(state.player.wallBombs) as _}
          <span class="bomb">{BOMB}</span>
        {/each}
        {#each Array(Math.max(0, 3 - state.player.wallBombs)) as _}
          <span class="bomb used">{BOMB}</span>
        {/each}
      </span>
    </div>

    <!-- Power Crystal timer -->
    {#if powerUpPct > 0}
      <div class="power-up-bar-wrap">
        <span class="hud-label crystal-label">⚡ POWER CRYSTAL</span>
        <div class="power-up-bar">
          <div class="power-up-fill" style="width: {powerUpPct}%"></div>
        </div>
      </div>
    {/if}

    <!-- Freeze Clock timer -->
    {#if freezePct > 0}
      <div class="power-up-bar-wrap">
        <span class="hud-label freeze-label">🕒 FREEZE CLOCK</span>
        <div class="power-up-bar">
          <div class="freeze-fill" style="width: {freezePct}%"></div>
        </div>
      </div>
    {/if}

    <!-- Controls hint -->
    <div class="hud-block hud-right controls-hint">
      <span>WASD / Arrows · Space: Wall · F1: Debug</span>
    </div>
  </div>
</div>

<style>
  .hud {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 12px 16px;
    font-family: 'Outfit', 'Inter', sans-serif;
  }

  .hud-top, .hud-bottom {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(6px);
    border-radius: 12px;
    padding: 8px 16px;
    border: 1px solid rgba(255,255,255,0.08);
  }

  .hud-block {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 80px;
  }

  .hud-center { flex: 1; text-align: center; align-items: center; }
  .hud-right { margin-left: auto; align-items: flex-end; }

  .hud-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: rgba(255,255,255,0.45);
    text-transform: uppercase;
  }

  .hud-value {
    font-size: 20px;
    font-weight: 800;
    color: #ffffff;
    line-height: 1;
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .score-value {
    color: #39ff14;
    text-shadow: 0 0 10px rgba(57,255,20,0.5);
  }

  .hud-right-most {
    margin-left: 12px;
  }

  .icon-btn {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 8px;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    font-size: 18px;
    transition: all 0.15s ease;
  }

  .icon-btn:hover {
    background: rgba(255,255,255,0.2);
    transform: scale(1.05);
  }

  .icon-btn:active {
    transform: scale(0.95);
  }

  .wave-value {
    font-size: 26px;
    color: #f72585;
    text-shadow: 0 0 14px rgba(247,37,133,0.6);
  }

  .heart { font-size: 18px; }
  .heart.dead { opacity: 0.2; }
  .bomb { font-size: 18px; }
  .bomb.used { opacity: 0.2; filter: grayscale(1); }

  .power-up-bar-wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 0 8px;
  }

  .crystal-label {
    color: #f72585;
    text-shadow: 0 0 6px rgba(247,37,133,0.7);
  }

  .power-up-bar {
    height: 6px;
    background: rgba(255,255,255,0.12);
    border-radius: 9999px;
    overflow: hidden;
  }

  .power-up-fill {
    height: 100%;
    background: linear-gradient(90deg, #7b2ff7, #f72585);
    border-radius: 9999px;
    transition: width 0.1s linear;
    box-shadow: 0 0 8px rgba(247,37,133,0.7);
  }

  .freeze-label {
    color: #00e5ff;
    text-shadow: 0 0 6px rgba(0, 229, 255, 0.7);
  }

  .freeze-fill {
    height: 100%;
    background: linear-gradient(90deg, #0077ff, #00e5ff);
    border-radius: 9999px;
    transition: width 0.1s linear;
    box-shadow: 0 0 8px rgba(0, 229, 255, 0.7);
  }

  .controls-hint {
    font-size: 11px;
    color: rgba(255,255,255,0.3);
    white-space: nowrap;
  }
</style>
