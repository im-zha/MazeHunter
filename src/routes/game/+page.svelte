<!-- src/routes/game/+page.svelte — Game Screen -->
<script lang="ts">
  import { GamePhase } from '$lib/core/types.js';
  import { gameState } from '$lib/stores/game-state.js';
  import GameCanvas from '$lib/components/GameCanvas.svelte';
  import HUD from '$lib/components/HUD.svelte';
  import AlgorithmPanel from '$lib/components/AlgorithmPanel.svelte';
  import GameOverScreen from '$lib/components/GameOverScreen.svelte';
  import InstructionsModal from '$lib/components/InstructionsModal.svelte';
  import { goto } from '$app/navigation';


  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  let gameCanvas: GameCanvas;
  let showInstructions = $state(false);

  const gs = $derived($gameState);
  const isPaused = $derived(gs.phase === GamePhase.PAUSED);

  onMount(() => {
    // Check if we are trying to load
    const wantLoad = $page.url.searchParams.get('load') === 'true';
    if (wantLoad) {
      try {
        const data = localStorage.getItem('mazehunter_save');
        if (data && gameCanvas) {
          // slight delay ensures GameCanvas $effect is completed building the initial maze
          setTimeout(() => gameCanvas.loadGame(JSON.parse(data)), 0);
        }
      } catch (e) {
        console.error('Failed to load save data', e);
      }
    }
  });

  function handleRestart() {
    gameCanvas?.restart();
  }

  function handleSave() {
    try {
      localStorage.setItem('mazehunter_save', JSON.stringify($gameState));
      alert('Game Saved! You can continue from the Main Menu.');
      gameCanvas?.resume();
    } catch (e) {
      alert('Failed to save game.');
    }
  }
</script>

<svelte:head>
  <title>Maze Hunter — Playing</title>
</svelte:head>

<div class="game-root">
  <!-- z-0: Canvas — fills entire viewport, game renderer draws here -->
  <div class="canvas-layer">
    <GameCanvas bind:this={gameCanvas} />
  </div>

  <!-- z-10 + z-20: Scanlines, Vignette & HUD (rendered inside HUD component) -->
  <HUD onPause={() => gameCanvas?.pause()} />

  <!-- Algorithm debug panel -->
  <AlgorithmPanel />

  <!-- Pause overlay -->
  {#if isPaused}
    <div class="overlay" role="dialog" aria-modal="true" aria-label="Paused">
      <div class="pause-modal">
        <h2 class="pause-title">⏸ Paused</h2>
        <div class="pause-actions">
          <button class="btn btn-primary" onclick={() => gameCanvas?.resume()} id="resume-btn">
            ▶ Resume
          </button>
          
          <button class="btn btn-secondary" onclick={() => showInstructions = true} id="how-to-play-pause-btn">
            📖 How To Play
          </button>

          {#if gs.wave > 1}
            <button class="btn btn-primary" style="background: #39ff14; color: #000; box-shadow: 0 4px 20px rgba(57,255,20,0.4);" onclick={handleSave} id="save-btn">
              💾 Save Game
            </button>
          {/if}
          <button class="btn btn-secondary" onclick={() => gameCanvas?.restart()} id="restart-btn">
            🔄 Restart Run
          </button>
          <button class="btn btn-secondary" onclick={() => goto('/')} id="menu-btn">
            🏠 Back to Menu
          </button>
        </div>
        <p class="pause-hint">Press Escape or P to resume</p>
      </div>
    </div>
  {/if}

  {#if showInstructions}
    <InstructionsModal on:close={() => showInstructions = false} />
  {/if}

  <!-- Game Over / Win overlay -->
  <GameOverScreen onRestart={handleRestart} />
</div>

<style>
  .game-root {
    position: relative;
    width: 100vw;
    height: 100dvh;
    overflow: hidden;
    background: #0d0d1f;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Canvas — absolute, fills entire game-root at z-0 */
  .canvas-layer {
    position: absolute;
    inset: 0;
    z-index: 0;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  /* Pause overlay */
  .overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(14px);
    z-index: 40;
  }

  .pause-modal {
    background: linear-gradient(145deg, #0d0d1f, #1a1a2e);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 20px;
    padding: 40px 52px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    box-shadow: 0 0 60px rgba(0,0,0,0.8);
  }

  .pause-title {
    font-family: 'Outfit', sans-serif;
    font-size: 28px;
    font-weight: 800;
    color: #fff;
    margin: 0;
  }

  .pause-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 220px;
  }

  .btn {
    width: 100%;
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

  .btn-secondary {
    background: rgba(255,255,255,0.07);
    color: rgba(255,255,255,0.75);
    border: 1px solid rgba(255,255,255,0.1);
  }

  .pause-hint {
    font-family: 'Outfit', sans-serif;
    font-size: 12px;
    color: rgba(255,255,255,0.3);
    margin: 0;
  }
</style>
