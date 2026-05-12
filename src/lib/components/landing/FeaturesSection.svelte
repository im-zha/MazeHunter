<!-- FeaturesSection.svelte - Current game systems -->
<script lang="ts">
  const features = [
    {
      icon: 'travel_explore',
      title: 'Procedural Maze Pressure',
      desc: 'Every wave rebuilds a solvable maze, expands the route space, and keeps exits, pickups, and enemy pressure shifting.',
      tag: 'Generated per wave',
      color: '#4edea3',
    },
    {
      icon: 'psychology',
      title: 'Algorithmic Hunters',
      desc: 'Enemies pursue with BFS, Dijkstra, A*, and DFS behavior, then flip into flee states when power crystals turn the chase around.',
      tag: 'BFS / Dijkstra / A* / DFS',
      color: '#60a5fa',
    },
    {
      icon: 'public',
      title: 'Biome Rule Sets',
      desc: 'Data Jungle hides you in stealth growth, Cooling Sea bends movement through data streams, and Lava Core turns routes unstable.',
      tag: '3 tactical sectors',
      color: '#00ffff',
    },
    {
      icon: 'crisis_alert',
      title: 'Tactical AoE Events',
      desc: 'Cyber-Spore Bloom, Cryo-Geyser, and Volatile Eruption telegraph danger before the map detonates into biome-specific effects.',
      tag: 'Warning then impact',
      color: '#ff5b35',
    },
    {
      icon: 'vertical_align_center',
      title: 'Thermal Elevators',
      desc: 'Lava Core elevator tiles shake, collapse after a random delay, and regenerate five seconds later, forcing fast route decisions.',
      tag: 'Collapse cycle',
      color: '#ffb95f',
    },
    {
      icon: 'military_tech',
      title: 'Operator Records',
      desc: 'Players register before deployment, final runs are saved to SQLite, and the leaderboard ranks score, wave, sector, and outcome.',
      tag: 'SQLite leaderboard',
      color: '#b88cff',
    },
  ] as const;
</script>

<section class="mechanics-section">
  <div class="mechanics-inner">
    <header class="mechanics-header">
      <div>
        <p class="eyebrow">CURRENT BUILD SYSTEMS</p>
        <h2>Game Core Mechanics</h2>
      </div>
      <p class="summary">
        Maze Hunter is now built around shifting map rules, telegraphed hazard events,
        route collapse, and persistent operator scoring.
      </p>
    </header>

    <div class="mechanics-grid">
      {#each features as feature, i}
        <article class="mechanic-card" style="--mechanic-color: {feature.color}">
          <div class="card-head">
            <span class="card-index">{String(i + 1).padStart(2, '0')}</span>
            <span class="material-symbols-outlined mechanic-icon" aria-hidden="true">{feature.icon}</span>
          </div>
          <h3>{feature.title}</h3>
          <p>{feature.desc}</p>
          <div class="tag">{feature.tag}</div>
        </article>
      {/each}
    </div>
  </div>
</section>

<style>
  .mechanics-section {
    position: relative;
    padding: 118px 24px 112px;
    background:
      linear-gradient(180deg, #111315 0%, rgba(11, 12, 13, 0.98) 22%, rgba(8, 9, 10, 0.98) 78%, #141617 100%),
      radial-gradient(circle at 20% 10%, rgba(78, 222, 163, 0.09), transparent 30%),
      linear-gradient(180deg, #111315 0%, #08090a 100%);
    color: #fff;
    overflow: hidden;
  }

  .mechanics-section::before,
  .mechanics-section::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    height: 140px;
    pointer-events: none;
    z-index: 0;
  }

  .mechanics-section::before {
    top: 0;
    background: linear-gradient(180deg, #111315, rgba(17, 19, 21, 0));
  }

  .mechanics-section::after {
    bottom: 0;
    background: linear-gradient(180deg, rgba(20, 22, 23, 0), #141617);
  }

  .mechanics-inner {
    position: relative;
    z-index: 1;
    width: min(1180px, 100%);
    margin: 0 auto;
  }

  .mechanics-header {
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(280px, 0.7fr);
    gap: 28px;
    align-items: end;
    margin-bottom: 34px;
  }

  .eyebrow {
    margin: 0 0 10px;
    color: #4edea3;
    font: 900 10px 'Outfit', sans-serif;
    letter-spacing: 0.22em;
    text-transform: uppercase;
  }

  h2 {
    margin: 0;
    font: 900 clamp(34px, 7vw, 68px) / 0.9 'Outfit', sans-serif;
    text-transform: uppercase;
    letter-spacing: 0;
  }

  .summary {
    margin: 0;
    color: rgba(255, 255, 255, 0.58);
    font: 600 15px / 1.55 'Outfit', sans-serif;
  }

  .mechanics-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    border: 1px solid rgba(255, 255, 255, 0.09);
  }

  .mechanic-card {
    position: relative;
    min-height: 265px;
    padding: 24px;
    border-right: 1px solid rgba(255, 255, 255, 0.09);
    border-bottom: 1px solid rgba(255, 255, 255, 0.09);
    background: rgba(255, 255, 255, 0.025);
    overflow: hidden;
    transition: background 0.16s ease, transform 0.16s ease;
  }

  .mechanic-card:nth-child(3n) {
    border-right: none;
  }

  .mechanic-card:nth-last-child(-n + 3) {
    border-bottom: none;
  }

  .mechanic-card::before {
    content: '';
    position: absolute;
    inset: 0 0 auto;
    height: 3px;
    background: var(--mechanic-color);
    opacity: 0.85;
  }

  .mechanic-card:hover {
    background: color-mix(in srgb, var(--mechanic-color) 9%, rgba(255, 255, 255, 0.03));
    transform: translateY(-3px);
  }

  .card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28px;
  }

  .card-index {
    color: var(--mechanic-color);
    font: 900 11px 'JetBrains Mono', monospace;
    letter-spacing: 0.14em;
  }

  .mechanic-icon {
    display: grid;
    place-items: center;
    width: 46px;
    height: 46px;
    border: 1px solid color-mix(in srgb, var(--mechanic-color) 45%, transparent);
    color: var(--mechanic-color);
    background: color-mix(in srgb, var(--mechanic-color) 8%, transparent);
    font-size: 27px;
  }

  h3 {
    margin: 0 0 12px;
    color: #fff;
    font: 900 20px / 1.08 'Outfit', sans-serif;
    text-transform: uppercase;
    letter-spacing: 0;
  }

  .mechanic-card p {
    margin: 0;
    color: rgba(255, 255, 255, 0.58);
    font: 600 13px / 1.55 'Outfit', sans-serif;
  }

  .tag {
    position: absolute;
    left: 24px;
    right: 24px;
    bottom: 20px;
    padding-top: 14px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    color: var(--mechanic-color);
    font: 900 10px 'Outfit', sans-serif;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  @media (max-width: 940px) {
    .mechanics-header,
    .mechanics-grid {
      grid-template-columns: 1fr;
    }

    .mechanic-card,
    .mechanic-card:nth-child(3n),
    .mechanic-card:nth-last-child(-n + 3) {
      border-right: none;
      border-bottom: 1px solid rgba(255, 255, 255, 0.09);
    }

    .mechanic-card:last-child {
      border-bottom: none;
    }
  }
</style>
