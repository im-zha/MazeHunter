<!-- GameOverScreen.svelte — Game Over / Win overlay -->
<script lang="ts">
  import { gameState } from '$lib/stores/game-state.js';
  import { GamePhase } from '$lib/core/types.js';
  import { goto } from '$app/navigation';

  interface Props {
    onRestart: () => void;
  }

  let { onRestart }: Props = $props();

  const state   = $derived($gameState);
  const isWin   = $derived(state.phase === GamePhase.WIN);
  const isOver  = $derived(state.phase === GamePhase.GAME_OVER);
  const visible = $derived(isWin || isOver);
</script>

{#if visible}
  <div class="overlay" role="dialog" aria-modal="true" aria-label={isWin ? 'You Win' : 'Game Over'}>
    <div class="modal" class:win={isWin} class:lose={isOver}>
      <!-- Title -->
      <div class="title-wrap">
        {#if isWin}
          <div class="trophy">🏆</div>
          <h2 class="title win-title">You Escaped!</h2>
        {:else}
          <div class="trophy">💀</div>
          <h2 class="title lose-title">Game Over</h2>
        {/if}
      </div>

      <!-- Stats -->
      <div class="stats">
        <div class="stat">
          <span class="stat-label">Final Score</span>
          <span class="stat-value score">{state.score.toLocaleString()}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Waves Cleared</span>
          <span class="stat-value">{Math.max(0, state.wave - 1)}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Lives Remaining</span>
          <span class="stat-value">{state.lives}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="actions">
        <button class="btn btn-primary" onclick={onRestart} id="restart-btn">
          🔄 Play Again
        </button>
        <button class="btn btn-secondary" onclick={() => goto('/')} id="menu-btn">
          🏠 Main Menu
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(12px);
    z-index: 50;
  }

  .modal {
    background: linear-gradient(145deg, #0d0d1f, #1a1a2e);
    border-radius: 20px;
    padding: 40px 48px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 28px;
    min-width: 320px;
    box-shadow: 0 0 60px rgba(0,0,0,0.8);
  }

  .modal.win {
    border: 2px solid rgba(0,255,135,0.4);
    box-shadow: 0 0 60px rgba(0,255,135,0.15);
  }

  .modal.lose {
    border: 2px solid rgba(247,37,133,0.4);
    box-shadow: 0 0 60px rgba(247,37,133,0.15);
  }

  .title-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .trophy { font-size: 48px; }

  .title {
    font-family: 'Outfit', sans-serif;
    font-size: 32px;
    font-weight: 800;
    margin: 0;
    letter-spacing: -0.02em;
  }

  .win-title {
    color: #00ff87;
    text-shadow: 0 0 20px rgba(0,255,135,0.6);
  }

  .lose-title {
    color: #f72585;
    text-shadow: 0 0 20px rgba(247,37,133,0.6);
  }

  .stats {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    background: rgba(255,255,255,0.04);
    border-radius: 12px;
    padding: 16px 20px;
    border: 1px solid rgba(255,255,255,0.06);
  }

  .stat {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .stat-label {
    font-family: 'Outfit', sans-serif;
    font-size: 13px;
    color: rgba(255,255,255,0.5);
    font-weight: 500;
  }

  .stat-value {
    font-family: 'Outfit', monospace;
    font-size: 18px;
    font-weight: 800;
    color: #fff;
  }

  .stat-value.score {
    color: #39ff14;
    text-shadow: 0 0 10px rgba(57,255,20,0.5);
  }

  .actions {
    display: flex;
    gap: 12px;
    width: 100%;
  }

  .btn {
    flex: 1;
    padding: 14px 20px;
    border-radius: 12px;
    border: none;
    font-family: 'Outfit', sans-serif;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .btn:hover { transform: translateY(-2px); }
  .btn:active { transform: translateY(0); }

  .btn-primary {
    background: linear-gradient(135deg, #7b2ff7, #f72585);
    color: #fff;
    box-shadow: 0 4px 20px rgba(123,47,247,0.4);
  }

  .btn-primary:hover {
    box-shadow: 0 6px 28px rgba(123,47,247,0.6);
  }

  .btn-secondary {
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.75);
    border: 1px solid rgba(255,255,255,0.12);
  }

  .btn-secondary:hover {
    background: rgba(255,255,255,0.14);
  }
</style>
