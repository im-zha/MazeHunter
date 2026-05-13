<!-- MainMenuSection.svelte - Tactical mission hub -->
<script lang="ts">
  interface MenuItem {
    id: string;
    icon: string;
    label: string;
    desc: string;
    meta: () => string;
    action: () => void;
    disabled?: () => boolean;
    tone: 'primary' | 'cyan' | 'amber';
  }

  interface Props {
    hasSave: boolean;
    onContinue: () => void;
    onLeaderboard: () => void;
    onHowToPlay: () => void;
  }
  let { hasSave, onContinue, onLeaderboard, onHowToPlay }: Props = $props();

  const menuItems = $derived<MenuItem[]>([
    {
      id: '01',
      icon: 'history',
      label: 'Continue Run',
      desc: 'Resume from the last saved wave with your current route pressure intact.',
      meta: () => hasSave ? 'Save file detected' : 'No save file',
      action: () => onContinue(),
      disabled: () => !hasSave,
      tone: 'primary',
    },
    {
      id: '02',
      icon: 'leaderboard',
      label: 'Leaderboard',
      desc: 'Review top operators, final scores, sectors, threat level, and outcome logs.',
      meta: () => 'SQLite records',
      action: () => onLeaderboard(),
      tone: 'cyan',
    },
    {
      id: '03',
      icon: 'menu_book',
      label: 'Field Manual',
      desc: 'Open survival protocols for movement, wall bombs, hazards, and extraction.',
      meta: () => 'Controls and rules',
      action: () => onHowToPlay(),
      tone: 'amber',
    },
  ]);

  const sectorSignals = [
    { label: 'Data Jungle', detail: 'Cyber-Spore Bloom', color: '#4edea3' },
    { label: 'Cooling Sea', detail: 'Cryo-Geyser', color: '#7ddbd2' },
    { label: 'Lava Core', detail: 'Volatile Eruption', color: '#ffb95f' },
  ] as const;
</script>

<section class="mission-hub">
  <div class="hub-inner">
    <header class="hub-header">
      <div>
        <p class="eyebrow">COMMAND DECK</p>
        <h2>Main Menu</h2>
      </div>
      <div class="hub-status" aria-label="Current system status">
        <span class="status-dot"></span>
        <span>Mission systems armed</span>
      </div>
    </header>

    <div class="hub-grid">
      <div class="command-panel">
        <div class="panel-top">
          <span class="material-symbols-outlined" aria-hidden="true">radar</span>
          <div>
            <p class="panel-kicker">Active Sectors</p>
            <h3>Hazard Rotation</h3>
          </div>
        </div>

        <div class="sector-list">
          {#each sectorSignals as signal}
            <div class="sector-row" style="--signal-color: {signal.color}">
              <span class="sector-light"></span>
              <div>
                <p>{signal.label}</p>
                <span>{signal.detail}</span>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <div class="action-grid">
        {#each menuItems as item}
          <button
            id="menu-{item.id}"
            onclick={item.action}
            class="action-card tone-{item.tone}"
            disabled={item.disabled?.() ?? false}
          >
            <div class="action-index">{item.id}</div>
            <span class="material-symbols-outlined action-icon" aria-hidden="true">{item.icon}</span>
            <div class="action-copy">
              <h3>{item.label}</h3>
              <p>{item.desc}</p>
            </div>
            <div class="action-meta">
              <span>{item.meta()}</span>
              <span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
            </div>
          </button>
        {/each}
      </div>
    </div>
  </div>
</section>

<style>
  .mission-hub {
    --hero-primary: #4edea3;
    --hero-cyan: #7ddbd2;
    --silver-white: #f8fafc;
    --primary-soft: rgba(78, 222, 163, 0.14);
    --primary-line: rgba(78, 222, 163, 0.3);
    --deep-surface: rgba(14, 14, 16, 0.86);
    position: relative;
    padding: 118px 24px 104px;
    background:
      radial-gradient(circle at 50% 18%, rgba(78, 222, 163, 0.06), transparent 34%),
      radial-gradient(circle at 82% 42%, rgba(125, 219, 210, 0.035), transparent 30%),
      linear-gradient(180deg, #080a0c 0%, #0b0d0f 18%, #101214 72%, #111315 100%),
      #0b0d0f;
    border-top: 0;
    border-bottom: 0;
    color: #fff;
    overflow: hidden;
  }

  .mission-hub::before,
  .mission-hub::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    height: 120px;
    pointer-events: none;
    z-index: 0;
  }

  .mission-hub::before {
    top: 0;
    background: linear-gradient(180deg, #080a0c 0%, rgba(8, 10, 12, 0.82) 35%, rgba(8, 10, 12, 0) 100%);
  }

  .mission-hub::after {
    bottom: 0;
    background: linear-gradient(180deg, rgba(17, 19, 21, 0), #111315);
  }

  .hub-inner {
    position: relative;
    z-index: 1;
    width: min(1180px, 100%);
    margin: 0 auto;
  }

  .hub-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 28px;
  }

  .eyebrow,
  .panel-kicker {
    margin: 0 0 8px;
    color: var(--silver-white);
    font: 900 10px 'Outfit', sans-serif;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    text-shadow: 0 0 14px rgba(255, 255, 255, 0.18);
  }

  h2 {
    margin: 0;
    font: 900 clamp(32px, 6vw, 58px) / 0.92 'Outfit', sans-serif;
    text-transform: uppercase;
    letter-spacing: 0;
    color: #fff;
    text-shadow:
      0 0 8px rgba(255, 255, 255, 0.42),
      0 0 28px rgba(78, 222, 163, 0.34);
  }

  .hub-status {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 40px;
    padding: 0 14px;
    border: 1px solid var(--primary-line);
    background: rgba(78, 222, 163, 0.08);
    color: rgba(248, 250, 252, 0.8);
    font: 800 11px 'Outfit', sans-serif;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    background: var(--hero-primary);
    box-shadow: 0 0 12px var(--hero-primary);
  }

  .hub-grid {
    display: grid;
    grid-template-columns: minmax(260px, 0.82fr) minmax(0, 1.6fr);
    gap: 16px;
  }

  .command-panel,
  .action-card {
    border: 1px solid var(--primary-line);
    background:
      linear-gradient(180deg, rgba(78, 222, 163, 0.045), rgba(255, 255, 255, 0.014)),
      var(--deep-surface);
  }

  .command-panel {
    min-height: 100%;
    padding: 22px;
    border-top: 3px solid var(--hero-primary);
    box-shadow:
      inset 0 0 38px rgba(78, 222, 163, 0.1),
      0 0 30px rgba(78, 222, 163, 0.12);
  }

  .panel-top {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 24px;
  }

  .panel-top .material-symbols-outlined {
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    border: 1px solid rgba(78, 222, 163, 0.42);
    color: #b8ffe0;
    background: rgba(78, 222, 163, 0.1);
    box-shadow: inset 0 0 18px rgba(78, 222, 163, 0.12);
  }

  .panel-top h3 {
    margin: 0;
    font: 900 23px / 1 'Outfit', sans-serif;
    text-transform: uppercase;
    letter-spacing: 0;
    color: #fff;
    text-shadow: 0 0 14px rgba(255, 255, 255, 0.2);
  }

  .sector-list {
    display: grid;
    gap: 10px;
  }

  .sector-row {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 12px;
    align-items: center;
    min-height: 64px;
    padding: 12px;
    background:
      linear-gradient(90deg, color-mix(in srgb, var(--signal-color) 14%, transparent), transparent 72%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0.012)),
      rgba(10, 12, 14, 0.84);
    border-left: 2px solid var(--signal-color);
  }

  .sector-light {
    width: 10px;
    height: 10px;
    background: var(--signal-color);
    box-shadow: 0 0 14px var(--signal-color);
  }

  .sector-row p,
  .sector-row span {
    margin: 0;
    font-family: 'Outfit', sans-serif;
    text-transform: uppercase;
  }

  .sector-row p {
    color: #fff;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 0.06em;
  }

  .sector-row span {
    color: rgba(255, 255, 255, 0.46);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.1em;
  }

  .action-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .action-card {
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 270px;
    padding: 20px;
    color: #fff;
    text-align: left;
    cursor: pointer;
    overflow: hidden;
    box-shadow:
      inset 0 0 0 1px rgba(78, 222, 163, 0.06),
      0 10px 28px rgba(0, 0, 0, 0.18);
    transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease, box-shadow 0.16s ease;
  }

  .action-card::before {
    content: '';
    position: absolute;
    inset: 0 0 auto;
    height: 3px;
    background: var(--tone-color);
    opacity: 0.85;
  }

  .action-card:hover {
    transform: translateY(-4px);
    border-color: #6ffbbe;
    background:
      linear-gradient(180deg, rgba(78, 222, 163, 0.09), rgba(255, 255, 255, 0.02)),
      rgba(13, 15, 17, 0.96);
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, var(--tone-color) 22%, transparent),
      0 0 20px rgba(78, 222, 163, 0.34),
      0 16px 32px rgba(0, 0, 0, 0.28);
  }

  .action-card:disabled {
    cursor: not-allowed;
    opacity: 0.42;
    transform: none;
  }

  .tone-primary { --tone-color: #4edea3; }
  .tone-cyan { --tone-color: #7ddbd2; }
  .tone-amber { --tone-color: #ffb95f; }

  .action-index {
    color: var(--tone-color);
    font: 900 11px 'JetBrains Mono', monospace;
    letter-spacing: 0.14em;
  }

  .action-icon {
    width: 52px;
    height: 52px;
    display: grid;
    place-items: center;
    margin: 24px 0 20px;
    border: 1px solid color-mix(in srgb, var(--tone-color) 42%, transparent);
    color: color-mix(in srgb, var(--tone-color) 78%, #fff);
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--tone-color) 16%, transparent), rgba(78, 222, 163, 0.03));
    box-shadow: inset 0 0 18px color-mix(in srgb, var(--tone-color) 12%, transparent);
    font-size: 28px;
  }

  .action-copy {
    flex: 1;
  }

  .action-copy h3 {
    margin: 0 0 10px;
    font: 900 21px / 1.05 'Outfit', sans-serif;
    text-transform: uppercase;
    letter-spacing: 0;
  }

  .action-copy p {
    margin: 0;
    color: rgba(255, 255, 255, 0.56);
    font: 600 13px / 1.5 'Outfit', sans-serif;
  }

  .action-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 22px;
    padding-top: 14px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    color: var(--tone-color);
    font: 900 10px 'Outfit', sans-serif;
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }

  @media (max-width: 900px) {
    .hub-header,
    .hub-grid {
      grid-template-columns: 1fr;
    }

    .hub-header {
      align-items: flex-start;
      flex-direction: column;
    }

    .action-grid {
      grid-template-columns: 1fr;
    }

    .action-card {
      min-height: 220px;
    }
  }
</style>
