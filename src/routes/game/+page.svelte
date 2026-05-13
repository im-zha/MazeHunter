<!-- src/routes/game/+page.svelte - Game Screen -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import GameCanvas from '$lib/components/GameCanvas.svelte';
  import GameOverScreen from '$lib/components/GameOverScreen.svelte';
  import HUD from '$lib/components/HUD.svelte';
  import InstructionsModal from '$lib/components/InstructionsModal.svelte';
  import { MAP_THEMES } from '$lib/core/map-themes.js';
  import { GamePhase, type BiomeId, type Difficulty } from '$lib/core/types.js';
  import { gameState } from '$lib/stores/game-state.js';
  import { sessionConfig } from '$lib/stores/session-config.js';
  import { onMount } from 'svelte';

  let gameCanvas = $state<GameCanvas>();
  let showInstructions = $state(false);
  let canRenderGame = $state(false);

  const validDifficulties = new Set<Difficulty>(['easy', 'normal', 'hard']);
  const validBiomes = new Set<BiomeId>(['data_jungle', 'cooling_sea', 'lava_core', 'shuffle']);

  const gs = $derived($gameState);
  const isPaused = $derived(gs.phase === GamePhase.PAUSED);
  const pauseTheme = $derived(
    gs.currentBiome && MAP_THEMES[gs.currentBiome]
      ? MAP_THEMES[gs.currentBiome]
      : MAP_THEMES.data_jungle
  );

  onMount(() => {
    const wantLoad = $page.url.searchParams.get('load') === 'true';
    if (!wantLoad) {
      try {
        const player = JSON.parse(sessionStorage.getItem('mazehunter_player') ?? 'null');
        const mission = JSON.parse(sessionStorage.getItem('mazehunter_mission') ?? 'null');

        if (!player?.id || !validDifficulties.has(mission?.difficulty) || !validBiomes.has(mission?.biome)) {
          goto('/');
          return;
        }

        sessionConfig.set({
          difficulty: mission.difficulty,
          biome: mission.biome,
        });
      } catch {
        goto('/');
        return;
      }
    }

    canRenderGame = true;

    if (wantLoad) {
      try {
        const data = localStorage.getItem('mazehunter_save');
        if (data && gameCanvas) {
          const canvasRef = gameCanvas;
          setTimeout(() => canvasRef.loadGame(JSON.parse(data)), 0);
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
  <title>Maze Hunter - Playing</title>
</svelte:head>

<div class="game-root">
  {#if canRenderGame}
    <div class="canvas-layer">
      <GameCanvas bind:this={gameCanvas} />
    </div>

    <HUD onPause={() => gameCanvas?.pause()} />

  {:else}
    <div class="boot-screen" aria-live="polite">
      <span class="boot-dot"></span>
      <span>SYNCING MISSION DATA</span>
    </div>
  {/if}

  {#if canRenderGame && isPaused}
    <div
      class="overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Paused"
      style="--pause-accent: {pauseTheme.primaryColor}; --pause-accent-soft: {pauseTheme.primaryColor}33"
    >
      <div class="pause-scanlines" aria-hidden="true"></div>

      <section class="pause-modal">
        <div class="pause-header">
          <div class="pause-status">
            <span class="pause-dot"></span>
            <span>SYSTEM HOLD</span>
          </div>

          <div class="pause-title-row">
            <span class="material-symbols-outlined pause-icon" aria-hidden="true">pause</span>
            <div>
              <h2 class="pause-title">PAUSED</h2>
              <p class="pause-subtitle">Operator control suspended in {pauseTheme.label}</p>
            </div>
          </div>
        </div>

        <div class="pause-actions">
          <button class="btn btn-primary" onclick={() => gameCanvas?.resume()} id="resume-btn">
            <span class="material-symbols-outlined" aria-hidden="true">play_arrow</span>
            <span>RESUME</span>
          </button>

          <button class="btn btn-secondary" onclick={() => showInstructions = true} id="how-to-play-pause-btn">
            <span class="material-symbols-outlined" aria-hidden="true">menu_book</span>
            <span>HOW TO PLAY</span>
          </button>

          {#if gs.wave > 1}
            <button class="btn btn-secondary save-btn" onclick={handleSave} id="save-btn">
              <span class="material-symbols-outlined" aria-hidden="true">save</span>
              <span>SAVE GAME</span>
            </button>
          {/if}

          <button class="btn btn-secondary" onclick={() => gameCanvas?.restart()} id="restart-btn">
            <span class="material-symbols-outlined" aria-hidden="true">restart_alt</span>
            <span>RESTART RUN</span>
          </button>

          <button class="btn btn-secondary" onclick={() => goto('/')} id="menu-btn">
            <span class="material-symbols-outlined" aria-hidden="true">home</span>
            <span>MAIN MENU</span>
          </button>
        </div>

        <p class="pause-hint">ESC / P TO RESUME</p>
      </section>
    </div>
  {/if}

  {#if showInstructions}
    <InstructionsModal biome={gs.currentBiome} on:close={() => showInstructions = false} />
  {/if}

  {#if canRenderGame}
    <GameOverScreen onRestart={handleRestart} />
  {/if}
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

  .boot-screen {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #4edea3;
    font-family: 'Outfit', sans-serif;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.16em;
  }

  .boot-dot {
    width: 10px;
    height: 10px;
    background: #4edea3;
    box-shadow: 0 0 18px #4edea3;
    animation: boot-pulse 0.8s ease-in-out infinite alternate;
  }

  @keyframes boot-pulse {
    from { opacity: 0.35; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
  }

  .overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background:
      radial-gradient(circle at 50% 35%, var(--pause-accent-soft), transparent 34%),
      rgba(0,0,0,0.78);
    backdrop-filter: blur(10px);
    z-index: 40;
  }

  .pause-scanlines {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      to bottom,
      rgba(255,255,255,0),
      rgba(255,255,255,0) 50%,
      rgba(0,0,0,0.24) 50%,
      rgba(0,0,0,0.24)
    );
    background-size: 100% 4px;
    opacity: 0.7;
  }

  .pause-modal {
    position: relative;
    width: min(420px, 100%);
    background:
      linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02)),
      rgba(8, 10, 12, 0.92);
    border: 1px solid var(--pause-accent-soft);
    border-radius: 8px;
    padding: 22px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    box-shadow:
      0 24px 80px rgba(0,0,0,0.82),
      0 0 32px var(--pause-accent-soft),
      inset 0 0 0 1px rgba(255,255,255,0.04);
    overflow: hidden;
  }

  .pause-modal::before {
    content: '';
    position: absolute;
    inset: 0 0 auto;
    height: 3px;
    background: var(--pause-accent);
    box-shadow: 0 0 18px var(--pause-accent);
  }

  .pause-header {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .pause-status {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--pause-accent);
    font-family: 'Outfit', sans-serif;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .pause-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: var(--pause-accent);
    box-shadow: 0 0 10px var(--pause-accent);
  }

  .pause-title-row {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 16px;
  }

  .pause-icon {
    width: 52px;
    height: 52px;
    display: grid;
    place-items: center;
    border: 1px solid var(--pause-accent-soft);
    border-radius: 6px;
    color: var(--pause-accent);
    background: rgba(255,255,255,0.04);
    box-shadow: inset 0 0 18px var(--pause-accent-soft);
  }

  .pause-title {
    font-family: 'Outfit', sans-serif;
    font-size: clamp(34px, 9vw, 52px);
    line-height: 0.95;
    font-weight: 900;
    color: #fff;
    margin: 0;
    letter-spacing: 0;
    text-shadow: 0 0 22px var(--pause-accent-soft);
  }

  .pause-subtitle {
    margin: 8px 0 0;
    color: rgba(255,255,255,0.58);
    font-family: 'Outfit', sans-serif;
    font-size: 13px;
    line-height: 1.45;
  }

  .pause-actions {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .btn {
    width: 100%;
    min-height: 46px;
    padding: 12px 14px;
    border-radius: 6px;
    font-family: 'Outfit', sans-serif;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .btn:hover { transform: translateY(-2px); }
  .btn:active { transform: translateY(0); }

  .btn-primary {
    border: 1px solid var(--pause-accent);
    background: var(--pause-accent);
    color: #020304;
    box-shadow: 0 0 18px var(--pause-accent-soft);
  }

  .btn-secondary {
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.76);
    border: 1px solid rgba(255,255,255,0.14);
  }

  .btn-secondary:hover {
    background: rgba(255,255,255,0.1);
  }

  .save-btn {
    border-color: var(--pause-accent-soft);
    color: var(--pause-accent);
  }

  .pause-hint {
    font-family: 'Outfit', sans-serif;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.18em;
    color: rgba(255,255,255,0.34);
    margin: 0;
    text-align: center;
  }

  .material-symbols-outlined {
    font-family: 'Material Symbols Outlined', sans-serif;
    font-variation-settings: 'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 24;
    font-size: 22px;
    line-height: 1;
    user-select: none;
  }

  @media (max-width: 520px) {
    .overlay {
      align-items: flex-end;
      padding: 16px;
    }

    .pause-modal {
      padding: 18px;
    }

    .pause-title-row {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .pause-icon {
      width: 44px;
      height: 44px;
    }
  }
</style>
