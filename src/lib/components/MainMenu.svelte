<!-- MainMenu.svelte — Start screen with animated maze background -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { settings } from '$lib/stores/settings-store.js';
  import { AlgoType } from '$lib/core/types.js';
  import type { Difficulty } from '$lib/core/types.js';
  import InstructionsModal from './InstructionsModal.svelte';

  let showInstructions = $state(false);

  const difficulties: Difficulty[] = ['easy', 'normal', 'hard'];

  let hasSave = $state(false);

  import { onMount } from 'svelte';
  onMount(() => {
    hasSave = !!localStorage.getItem('mazehunter_save');
  });

  function startGame() {
    goto('/game');
  }

  function continueGame() {
    goto('/game?load=true');
  }

  function setDifficulty(d: Difficulty) {
    settings.update(s => ({ ...s, difficulty: d }));
  }
</script>

<svelte:head>
  <title>Maze Hunter — Main Menu</title>
  <meta name="description" content="A maze game where enemies use real graph-search algorithms: BFS, Dijkstra, A*, and DFS to hunt you down." />
</svelte:head>

<div class="menu-root">
  <!-- Animated grid background -->
  <div class="grid-bg" aria-hidden="true">
    {#each Array(400) as _, i}
      <div class="grid-cell" style="animation-delay: {(i * 73) % 3000}ms"></div>
    {/each}
  </div>

  <main class="menu-content">
    <!-- Logo -->
    <div class="logo-wrap">
      <div class="logo-icon">🌀</div>
      <h1 class="logo-title">Maze<span class="accent">Hunter</span></h1>
      <p class="logo-sub">Escape before the algorithms find you</p>
    </div>

    <!-- Settings Card -->
    <div class="card">
      <!-- Difficulty -->
      <div class="setting-group">
        <span class="setting-label">DIFFICULTY</span>
        <div class="btn-row">
          {#each difficulties as d}
            <button
              class="opt-btn"
              class:active={$settings.difficulty === d}
              onclick={() => setDifficulty(d)}
              id="diff-{d}"
            >
              {d.toUpperCase()}
            </button>
          {/each}
        </div>
      </div>
    </div>

    <!-- Enemy Legend -->
    <div class="legend">
      <span class="legend-item"><span class="dot" style="background:#60a5fa"></span>Ghost (BFS)</span>
      <span class="legend-item"><span class="dot" style="background:#f97316"></span>Heavy (Dijkstra)</span>
      <span class="legend-item"><span class="dot" style="background:#a855f7"></span>Hunter (A*)</span>
      <span class="legend-item"><span class="dot" style="background:#6b7280"></span>Shadow (DFS)</span>
    </div>

    {#if hasSave}
      <button class="start-btn continue-btn" onclick={continueGame} id="continue-game-btn">
        <span>CONTINUE GAME</span>
        <span class="start-arrow">→</span>
      </button>
    {/if}

    <!-- Start Button -->
    <button class="start-btn" onclick={startGame} id="start-game-btn">
      <span>START GAME</span>
      <span class="start-arrow">→</span>
    </button>
    
    <!-- How to Play Button -->
    <button class="start-btn how-to-play-btn" onclick={() => showInstructions = true} id="how-to-play-btn">
      <span>HOW TO PLAY</span>
    </button>

    <!-- Controls hint -->
    <p class="controls">
      WASD / Arrow Keys · Space: Place Wall · F1: Debug Mode
    </p>
  </main>

  {#if showInstructions}
    <InstructionsModal on:close={() => showInstructions = false} />
  {/if}
</div>

<style>
  :global(body) {
    margin: 0;
    background: #0d0d1f;
    min-height: 100dvh;
  }

  .menu-root {
    position: relative;
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  /* Animated grid background */
  .grid-bg {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-columns: repeat(20, 1fr);
    grid-auto-rows: 1fr;
    opacity: 0.15;
  }

  .grid-cell {
    border: 1px solid rgba(123, 47, 247, 0.3);
    animation: pulse 3s ease-in-out infinite alternate;
  }

  @keyframes pulse {
    0%   { background: transparent; }
    100% { background: rgba(123, 47, 247, 0.25); }
  }

  .menu-content {
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    padding: 32px 20px;
    max-width: 480px;
    width: 100%;
  }

  /* Logo */
  .logo-wrap {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  .logo-icon { font-size: 52px; }

  .logo-title {
    font-family: 'Outfit', sans-serif;
    font-size: clamp(36px, 8vw, 56px);
    font-weight: 900;
    color: #fff;
    margin: 0;
    letter-spacing: -0.03em;
  }

  .accent {
    color: #f72585;
    text-shadow: 0 0 24px rgba(247, 37, 133, 0.8);
  }

  .logo-sub {
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    color: rgba(255,255,255,0.45);
    margin: 0;
  }

  /* Settings card */
  .card {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    backdrop-filter: blur(12px);
    border-radius: 16px;
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .setting-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .setting-label {
    font-family: 'Outfit', sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    color: rgba(255,255,255,0.4);
  }

  .btn-row {
    display: flex;
    gap: 8px;
  }

  .opt-btn {
    flex: 1;
    padding: 10px 14px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.6);
    font-family: 'Outfit', sans-serif;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s ease;
    letter-spacing: 0.06em;
  }

  .opt-btn:hover {
    background: rgba(255,255,255,0.1);
    color: #fff;
  }

  .opt-btn.active {
    background: rgba(123, 47, 247, 0.3);
    border-color: #7b2ff7;
    color: #fff;
    box-shadow: 0 0 12px rgba(123,47,247,0.3);
  }

  /* Legend */
  .legend {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: 'Outfit', sans-serif;
    font-size: 12px;
    color: rgba(255,255,255,0.55);
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  /* Start button */
  .start-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 18px 32px;
    border-radius: 14px;
    border: none;
    background: linear-gradient(135deg, #7b2ff7 0%, #f72585 100%);
    color: #fff;
    font-family: 'Outfit', sans-serif;
    font-size: 18px;
    font-weight: 800;
    letter-spacing: 0.06em;
    cursor: pointer;
    box-shadow: 0 4px 28px rgba(123, 47, 247, 0.5);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .start-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 36px rgba(123, 47, 247, 0.7);
  }

  .start-btn:active {
    transform: translateY(0);
  }

  .continue-btn {
    background: linear-gradient(135deg, #00ff87 0%, #39ff14 100%);
    box-shadow: 0 4px 28px rgba(0, 255, 135, 0.4);
    color: #000;
  }

  .how-to-play-btn {
    background: transparent;
    border: 2px solid rgba(255, 255, 255, 0.2);
    box-shadow: none;
    padding: 12px 32px;
    font-size: 14px;
    letter-spacing: 0.1em;
  }
  
  .how-to-play-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.5);
    box-shadow: none;
    transform: translateY(-2px);
  }

  .start-arrow {
    font-size: 22px;
    transition: transform 0.15s ease;
  }

  .start-btn:hover .start-arrow {
    transform: translateX(4px);
  }

  .controls {
    font-family: 'Outfit', sans-serif;
    font-size: 12px;
    color: rgba(255,255,255,0.3);
    text-align: center;
    margin: 0;
  }
</style>
