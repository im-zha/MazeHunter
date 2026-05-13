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
      color: '#7ddbd2',
    },
    {
      icon: 'public',
      title: 'Biome Rule Sets',
      desc: 'Data Jungle hides you in stealth growth, Cooling Sea bends movement through data streams, and Lava Core turns routes unstable.',
      tag: '3 tactical sectors',
      color: '#6ffbbe',
    },
    {
      icon: 'crisis_alert',
      title: 'Tactical AoE Events',
      desc: 'Cyber-Spore Bloom, Cryo-Geyser, and Volatile Eruption telegraph danger before the map detonates into biome-specific effects.',
      tag: 'Warning then impact',
      color: '#ffb95f',
    },
    {
      icon: 'vertical_align_center',
      title: 'Thermal Elevators',
      desc: 'Lava Core elevator tiles shake, collapse after a random delay, and regenerate five seconds later, forcing fast route decisions.',
      tag: 'Collapse cycle',
      color: '#ff7a73',
    },
    {
      icon: 'military_tech',
      title: 'Operator Records',
      desc: 'Players register before deployment, final runs are saved to SQLite, and the leaderboard ranks score, wave, sector, and outcome.',
      tag: 'SQLite leaderboard',
      color: '#bbcabf',
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
    --hero-primary: #4edea3;
    --hero-cyan: #7ddbd2;
    --silver-white: #f8fafc;
    --primary-line: rgba(78, 222, 163, 0.3);
    --deep-surface: rgba(8, 22, 15, 0.82);
    position: relative;
    padding: 118px 24px 112px;
    background:
      radial-gradient(circle at 50% 4%, rgba(78, 222, 163, 0.18), transparent 38%),
      radial-gradient(circle at 10% 46%, rgba(125, 219, 210, 0.1), transparent 30%),
      radial-gradient(circle at 90% 62%, rgba(78, 222, 163, 0.08), transparent 26%),
      linear-gradient(180deg, #07090a 0%, #0a1b13 24%, #07090a 78%, #07120d 100%),
      #07090a;
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
    background: linear-gradient(180deg, #07090a, rgba(7, 9, 10, 0));
  }

  .mechanics-section::after {
    bottom: 0;
    background: linear-gradient(180deg, rgba(7, 9, 10, 0), #07120d);
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
    color: var(--silver-white);
    font: 900 10px 'Outfit', sans-serif;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    text-shadow: 0 0 14px rgba(255, 255, 255, 0.18);
  }

  h2 {
    margin: 0;
    font: 900 clamp(34px, 7vw, 68px) / 0.9 'Outfit', sans-serif;
    text-transform: uppercase;
    letter-spacing: 0;
    color: #fff;
    text-shadow:
      0 0 8px rgba(255, 255, 255, 0.42),
      0 0 30px rgba(78, 222, 163, 0.34);
  }

  .summary {
    margin: 0;
    color: rgba(248, 250, 252, 0.66);
    font: 600 15px / 1.55 'Outfit', sans-serif;
  }

  .mechanics-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    border: 1px solid var(--primary-line);
    box-shadow: 0 0 34px rgba(78, 222, 163, 0.12);
  }

  .mechanic-card {
    position: relative;
    min-height: 265px;
    padding: 24px;
    border-right: 1px solid rgba(78, 222, 163, 0.18);
    border-bottom: 1px solid rgba(78, 222, 163, 0.18);
    background:
      linear-gradient(180deg, rgba(78, 222, 163, 0.075), rgba(125, 219, 210, 0.018)),
      var(--deep-surface);
    overflow: hidden;
    transition: background 0.16s ease, transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
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

  .mechanic-card::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--mechanic-color) 8%, transparent), transparent 42%),
      radial-gradient(circle at 82% 18%, color-mix(in srgb, var(--mechanic-color) 12%, transparent), transparent 26%);
    opacity: 0.78;
  }

  .mechanic-card:hover {
    border-color: #6ffbbe;
    background:
      linear-gradient(180deg, rgba(78, 222, 163, 0.14), rgba(125, 219, 210, 0.04)),
      rgba(8, 24, 16, 0.94);
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, var(--mechanic-color) 18%, transparent),
      0 0 20px rgba(78, 222, 163, 0.34),
      0 16px 34px rgba(0, 0, 0, 0.26);
    transform: translateY(-3px);
  }

  .card-head {
    position: relative;
    z-index: 1;
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
    color: color-mix(in srgb, var(--mechanic-color) 78%, #fff);
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--mechanic-color) 16%, transparent), rgba(78, 222, 163, 0.03));
    box-shadow: inset 0 0 18px color-mix(in srgb, var(--mechanic-color) 12%, transparent);
    font-size: 27px;
  }

  h3 {
    position: relative;
    z-index: 1;
    margin: 0 0 12px;
    color: #fff;
    font: 900 20px / 1.08 'Outfit', sans-serif;
    text-transform: uppercase;
    letter-spacing: 0;
  }

  .mechanic-card p {
    position: relative;
    z-index: 1;
    margin: 0;
    color: rgba(255, 255, 255, 0.58);
    font: 600 13px / 1.55 'Outfit', sans-serif;
  }

  .tag {
    z-index: 1;
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
      border-bottom: 1px solid rgba(78, 222, 163, 0.18);
    }

    .mechanic-card:last-child {
      border-bottom: none;
    }
  }
</style>
