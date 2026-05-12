<script lang="ts">
  import { goto } from '$app/navigation';

  let { data } = $props();

  function formatBiome(value: string) {
    return value.replace(/_/g, ' ').toUpperCase();
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleString();
  }
</script>

<svelte:head>
  <title>Maze Hunter - Leaderboard</title>
</svelte:head>

<main class="leaderboard-root">
  <div class="scanlines" aria-hidden="true"></div>

  <section class="leaderboard-shell">
    <header class="header">
      <div>
        <p class="eyebrow">TACTICAL ARCHIVE</p>
        <h1>LEADERBOARD</h1>
        <p class="subtitle">Top recorded Maze Hunter runs stored in SQLite.</p>
      </div>

      <button class="back-btn" onclick={() => goto('/')}>
        <span class="material-symbols-outlined" aria-hidden="true">keyboard_backspace</span>
        COMMAND
      </button>
    </header>

    <div class="table-wrap">
      {#if data.rows.length}
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Operator</th>
              <th>Score</th>
              <th>Wave</th>
              <th>Sector</th>
              <th>Threat</th>
              <th>Result</th>
              <th>Logged</th>
            </tr>
          </thead>
          <tbody>
            {#each data.rows as row, i}
              <tr>
                <td class="rank">#{String(i + 1).padStart(2, '0')}</td>
                <td class="name">{row.name}</td>
                <td class="score">{row.score.toLocaleString()}</td>
                <td>{row.wave}</td>
                <td>{formatBiome(row.biome)}</td>
                <td>{row.difficulty.toUpperCase()}</td>
                <td class:win={row.outcome === 'win'}>{row.outcome === 'win' ? 'ESCAPED' : 'LOST'}</td>
                <td class="date">{formatDate(row.created_at)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {:else}
        <div class="empty">
          <span class="material-symbols-outlined" aria-hidden="true">leaderboard</span>
          <p>No runs recorded yet.</p>
        </div>
      {/if}
    </div>
  </section>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #07090a;
  }

  .leaderboard-root {
    min-height: 100dvh;
    position: relative;
    overflow: hidden;
    color: #f4f7f5;
    background:
      radial-gradient(circle at 50% 20%, rgba(78,222,163,0.12), transparent 34%),
      linear-gradient(180deg, #101315 0%, #07090a 100%);
    padding: 32px;
  }

  .scanlines {
    position: fixed;
    inset: 0;
    pointer-events: none;
    opacity: 0.55;
    background: linear-gradient(
      to bottom,
      rgba(255,255,255,0),
      rgba(255,255,255,0) 50%,
      rgba(0,0,0,0.22) 50%,
      rgba(0,0,0,0.22)
    );
    background-size: 100% 4px;
  }

  .leaderboard-shell {
    position: relative;
    z-index: 1;
    max-width: 1180px;
    margin: 0 auto;
    border: 1px solid rgba(78,222,163,0.22);
    border-top: 3px solid #4edea3;
    background: rgba(8, 10, 12, 0.84);
    box-shadow: 0 24px 90px rgba(0,0,0,0.72), 0 0 32px rgba(78,222,163,0.14);
  }

  .header {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    align-items: flex-start;
    padding: 28px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }

  .eyebrow {
    margin: 0 0 8px;
    color: #4edea3;
    font: 800 10px 'Outfit', sans-serif;
    letter-spacing: 0.22em;
  }

  h1 {
    margin: 0;
    font: 900 clamp(38px, 8vw, 76px) / 0.92 'Outfit', sans-serif;
    letter-spacing: 0;
  }

  .subtitle {
    margin: 12px 0 0;
    color: rgba(255,255,255,0.54);
    font: 500 14px 'Outfit', sans-serif;
  }

  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 42px;
    padding: 0 14px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(78,222,163,0.35);
    color: #4edea3;
    font: 900 12px 'Outfit', sans-serif;
    letter-spacing: 0.1em;
    cursor: pointer;
  }

  .table-wrap {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-family: 'Outfit', sans-serif;
  }

  th,
  td {
    padding: 14px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    text-align: left;
    white-space: nowrap;
  }

  th {
    color: rgba(255,255,255,0.44);
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  td {
    color: rgba(255,255,255,0.72);
    font-size: 13px;
    font-weight: 700;
  }

  tbody tr:hover {
    background: rgba(78,222,163,0.06);
  }

  .rank,
  .score {
    color: #4edea3;
  }

  .name {
    color: #fff;
    font-weight: 900;
  }

  .win {
    color: #00ffff;
  }

  .date {
    color: rgba(255,255,255,0.42);
  }

  .empty {
    min-height: 280px;
    display: grid;
    place-items: center;
    gap: 12px;
    color: rgba(255,255,255,0.44);
    font: 800 13px 'Outfit', sans-serif;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .empty .material-symbols-outlined {
    color: #4edea3;
    font-size: 42px;
  }

  .material-symbols-outlined {
    font-family: 'Material Symbols Outlined', sans-serif;
    font-size: 22px;
    line-height: 1;
  }

  @media (max-width: 700px) {
    .leaderboard-root {
      padding: 16px;
    }

    .header {
      flex-direction: column;
      padding: 20px;
    }
  }
</style>
