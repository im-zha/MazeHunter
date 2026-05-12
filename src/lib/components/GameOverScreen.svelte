<!-- GameOverScreen.svelte - Game Over / Win overlay -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { MAP_THEMES } from '$lib/core/map-themes.js';
  import { GamePhase } from '$lib/core/types.js';
  import { gameState } from '$lib/stores/game-state.js';

  interface Props {
    onRestart: () => void;
  }

  let { onRestart }: Props = $props();

  const currentState = $derived($gameState);
  const isWin = $derived(currentState.phase === GamePhase.WIN);
  const isOver = $derived(currentState.phase === GamePhase.GAME_OVER);
  const visible = $derived(isWin || isOver);
  const theme = $derived(
    currentState.currentBiome && MAP_THEMES[currentState.currentBiome]
      ? MAP_THEMES[currentState.currentBiome]
      : MAP_THEMES.data_jungle
  );
  const accent = $derived(isWin ? theme.primaryColor : '#ff3b5c');
  const status = $derived(isWin ? 'EXTRACTION COMPLETE' : 'SIGNAL LOST');
  const title = $derived(isWin ? 'YOU ESCAPED' : 'GAME OVER');
  const subtitle = $derived(
    isWin
      ? 'Maze route secured. Operator returned from the grid.'
      : 'Operator link terminated. Enemy contact exceeded survival threshold.'
  );

  let submittedScoreKey = $state('');

  $effect(() => {
    if (!visible) return;

    const scoreKey = `${currentState.phase}:${currentState.score}:${currentState.wave}:${currentState.round}`;
    if (submittedScoreKey === scoreKey) return;
    submittedScoreKey = scoreKey;

    try {
      const player = JSON.parse(sessionStorage.getItem('mazehunter_player') ?? 'null');
      const mission = JSON.parse(sessionStorage.getItem('mazehunter_mission') ?? 'null');
      if (!player?.id) return;

      fetch('/api/scores', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userId: player.id,
          score: currentState.score,
          wave: currentState.wave,
          lives: currentState.lives,
          biome: currentState.currentBiome,
          difficulty: mission?.difficulty ?? 'normal',
          outcome: isWin ? 'win' : 'game_over',
        }),
      }).catch(() => {});
    } catch {
      // Score persistence should never block the end screen.
    }
  });
</script>

{#if visible}
  <div class="overlay" role="dialog" aria-modal="true" aria-label={isWin ? 'You Win' : 'Game Over'}>
    <div class="scanlines" aria-hidden="true"></div>

    <section
      class="modal"
      class:win={isWin}
      class:lose={isOver}
      style="--end-accent: {accent}; --end-accent-soft: {accent}33"
    >
      <div class="modal-header">
        <div class="status-row">
          <span class="status-dot"></span>
          <span>{status}</span>
        </div>

        <div class="title-wrap">
          <span class="material-symbols-outlined status-icon" aria-hidden="true">
            {isWin ? 'verified' : 'warning'}
          </span>
          <div>
            <h2 class="title">{title}</h2>
            <p class="subtitle">{subtitle}</p>
          </div>
        </div>
      </div>

      <div class="stats">
        <div class="stat">
          <span class="stat-label">Final Score</span>
          <span class="stat-value score">{currentState.score.toLocaleString()}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Waves Cleared</span>
          <span class="stat-value">{Math.max(0, currentState.wave - 1)}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Lives Remaining</span>
          <span class="stat-value">{currentState.lives}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Sector</span>
          <span class="stat-value sector">{theme.label}</span>
        </div>
      </div>

      <div class="actions">
        <button class="btn btn-primary" onclick={onRestart} id="restart-btn">
          <span class="material-symbols-outlined" aria-hidden="true">restart_alt</span>
          <span>RESTART RUN</span>
        </button>
        <button class="btn btn-secondary" onclick={() => goto('/')} id="menu-btn">
          <span class="material-symbols-outlined" aria-hidden="true">home</span>
          <span>MAIN MENU</span>
        </button>
      </div>
    </section>
  </div>
{/if}

<style>
  .overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background:
      radial-gradient(circle at 50% 35%, rgba(78, 222, 163, 0.08), transparent 34%),
      rgba(0, 0, 0, 0.82);
    backdrop-filter: blur(10px);
    z-index: 50;
  }

  .scanlines {
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
    opacity: 0.75;
  }

  .modal {
    position: relative;
    width: min(520px, 100%);
    background:
      linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02)),
      rgba(8, 10, 12, 0.92);
    border: 1px solid var(--end-accent-soft);
    border-radius: 8px;
    padding: 22px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    box-shadow:
      0 24px 80px rgba(0,0,0,0.82),
      0 0 32px var(--end-accent-soft),
      inset 0 0 0 1px rgba(255,255,255,0.04);
    overflow: hidden;
  }

  .modal::before {
    content: '';
    position: absolute;
    inset: 0 0 auto;
    height: 3px;
    background: var(--end-accent);
    box-shadow: 0 0 18px var(--end-accent);
  }

  .modal-header {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .status-row {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--end-accent);
    font-family: 'Outfit', sans-serif;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: var(--end-accent);
    box-shadow: 0 0 10px var(--end-accent);
  }

  .title-wrap {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 16px;
  }

  .status-icon {
    width: 54px;
    height: 54px;
    display: grid;
    place-items: center;
    border: 1px solid var(--end-accent-soft);
    border-radius: 6px;
    color: var(--end-accent);
    background: rgba(255,255,255,0.04);
    box-shadow: inset 0 0 18px var(--end-accent-soft);
  }

  .title {
    font-family: 'Outfit', sans-serif;
    font-size: clamp(30px, 8vw, 54px);
    line-height: 0.95;
    font-weight: 900;
    margin: 0;
    color: #fff;
    letter-spacing: 0;
    text-shadow: 0 0 22px var(--end-accent-soft);
  }

  .subtitle {
    margin: 8px 0 0;
    max-width: 34rem;
    color: rgba(255,255,255,0.58);
    font-family: 'Outfit', sans-serif;
    font-size: 13px;
    line-height: 1.45;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.08);
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
    padding: 14px;
    background: rgba(3, 6, 8, 0.76);
  }

  .stat-label {
    font-family: 'Outfit', sans-serif;
    font-size: 10px;
    color: rgba(255,255,255,0.42);
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .stat-value {
    font-family: 'Outfit', sans-serif;
    font-size: 22px;
    font-weight: 800;
    color: #fff;
    line-height: 1;
    overflow-wrap: anywhere;
  }

  .stat-value.score {
    color: var(--end-accent);
    text-shadow: 0 0 10px var(--end-accent-soft);
  }

  .stat-value.sector {
    font-size: 14px;
    letter-spacing: 0.08em;
  }

  .actions {
    display: flex;
    gap: 10px;
  }

  .btn {
    flex: 1;
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
    border: 1px solid var(--end-accent);
    background: var(--end-accent);
    color: #020304;
    box-shadow: 0 0 18px var(--end-accent-soft);
  }

  .btn-primary:hover {
    box-shadow: 0 0 28px var(--end-accent-soft);
  }

  .btn-secondary {
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.76);
    border: 1px solid rgba(255,255,255,0.14);
  }

  .btn-secondary:hover {
    background: rgba(255,255,255,0.1);
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
      padding: 16px;
      align-items: flex-end;
    }

    .modal {
      padding: 18px;
    }

    .title-wrap {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .status-icon {
      width: 44px;
      height: 44px;
    }

    .stats {
      grid-template-columns: 1fr;
    }

    .actions {
      flex-direction: column;
    }
  }
</style>
