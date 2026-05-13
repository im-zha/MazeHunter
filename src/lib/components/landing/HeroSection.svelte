<!-- HeroSection.svelte — Full-screen hero with Cyberpunk Cockpit start modal -->
<script lang="ts">
  import type { BiomeId } from "$lib/core/types.js";
  import type { Difficulty } from "$lib/core/types.js";
  import BiomeDemo from "$lib/components/landing/BiomeDemo.svelte";

  interface Props {
    onStartGame: (
      difficulty: Difficulty,
      biome: BiomeId,
    ) => void | Promise<void>;
  }
  let { onStartGame }: Props = $props();

  /** Controls whether the mission config modal is open */
  let showModal = $state(false);

  /** Currently selected values in the modal */
  let selectedDifficulty = $state<Difficulty>("normal");
  let selectedBiome = $state<BiomeId>("data_jungle");
  let playerName = $state("");
  let startError = $state("");
  let isStarting = $state(false);

  /** Whether the biome demo panel is visible */
  let showBiomeDemo = $state(false);

  function scrollToAI() {
    document
      .getElementById("ai-archetypes")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  async function confirmMission() {
    const name = playerName.trim().replace(/\s+/g, " ");
    if (name.length < 2) {
      startError = "Enter an operator name with at least 2 characters.";
      return;
    }

    isStarting = true;
    startError = "";

    try {
      const response = await fetch("/api/players", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result?.error ?? "Could not register operator.");

      sessionStorage.setItem("mazehunter_player", JSON.stringify(result.user));
      sessionStorage.setItem(
        "mazehunter_mission",
        JSON.stringify({
          difficulty: selectedDifficulty,
          biome: selectedBiome,
          startedAt: Date.now(),
        }),
      );

      showModal = false;
      await onStartGame(selectedDifficulty, selectedBiome);
    } catch (error) {
      startError =
        error instanceof Error ? error.message : "Could not start mission.";
    } finally {
      isStarting = false;
    }
  }

  // ── Biome definitions for the selector ────────────────────────────────────
  const biomes: {
    id: Exclude<BiomeId, "shuffle">;
    code: string;
    label: string;
    desc: string;
    color: string;
    gimmick: string;
  }[] = [
    {
      id: "data_jungle",
      code: "[01]",
      label: "DATA JUNGLE",
      desc: "Stealth Nodes hide you from enemy sensors.",
      color: "#4edea3",
      gimmick: "STEALTH NODES",
    },
    {
      id: "cooling_sea",
      code: "[02]",
      label: "COOLING SEA",
      desc: "Data Streams multiply or halve movement speed.",
      color: "#00ffff",
      gimmick: "DATA STREAMS",
    },
    {
      id: "lava_core",
      code: "[03]",
      label: "LAVA CORE",
      desc: "Volatile Sectors explode every 5 s — stay clear.",
      color: "#ff4500",
      gimmick: "VOLATILE SECTORS",
    },
  ];

  const shuffle = {
    id: "shuffle" as BiomeId,
    code: "[04]",
    label: "SHUFFLE PROTOCOL",
    desc: "Random biome every round.",
    color: "#b82ff7",
    gimmick: "RANDOMISED",
  };

  const difficulties: {
    id: Difficulty;
    label: string;
    sub: string;
    color: string;
  }[] = [
    {
      id: "easy",
      label: "EASY",
      sub: "Recruit speed · Slow growth",
      color: "#4edea3",
    },
    {
      id: "normal",
      label: "MEDIUM",
      sub: "Standard speed · Normal growth",
      color: "#ffb95f",
    },
    {
      id: "hard",
      label: "HARD",
      sub: "Elite speed · Rapid escalation",
      color: "#ff4757",
    },
  ];

  function activeBiomeColor() {
    if (selectedBiome === "shuffle") return shuffle.color;
    return biomes.find((b) => b.id === selectedBiome)?.color ?? "#4edea3";
  }
</script>

<section
  class="hero-section relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
>
  <!-- Maze Background with Fog -->
  <div class="absolute inset-0 z-0">
    <div
      class="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#131315_70%)] z-10"
    ></div>
    <div class="absolute inset-0 bg-background/40 z-20"></div>
    <div
      class="w-full h-full opacity-30 grayscale"
      style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuBOmQKkeZh3TWkENXsM8qCd_wOI0L8lRMsAKceGnJxSqkov71OsPXKYqO5dwy_-CM05K7ujzS5rUcbGEO4NPm8ZTbD8ynZ0R7EKHQWvrJnfB6Ib9MdiIm3QwcoY52bu8A0lSAHaqhPgduDGnv7x1hLTO0J9uZzl-zQzWp0tdwqibouxNf6UgAzcRdJ8JuQ9nhc0ycqzPNE0YkSsM7EoHPlw3cNdl_fmDGPM6h8O4NNDY2UrS4f0adEwudm69WKjtKIRYi9nQJStPIbg'); background-size: cover; background-position: center;"
      aria-hidden="true"
    ></div>
    <!-- Player dot -->
    <div
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30"
      aria-hidden="true"
    >
      <div
        class="size-6 bg-primary rounded-sm rotate-45 animate-pulse shadow-[0_0_20px_#4edea3]"
      ></div>
    </div>
  </div>

  <!-- Content -->
  <div class="relative z-30 container mx-auto px-margin text-center">
    <div
      class="inline-block mb-6 px-3 py-1 border border-primary/30 bg-primary/5"
    >
      <span
        class="font-label-caps text-xs text-primary tracking-widest uppercase"
        >Encryption Level: Maximum</span
      >
    </div>

    <h2
      class="text-7xl md:text-9xl font-display-lg font-black tracking-tighter text-white mb-4 italic select-none"
    >
      MAZE<br /><span class="text-primary text-glow">HUNTER</span>
    </h2>

    <p
      class="max-w-2xl mx-auto font-body-md text-lg text-on-surface-variant mb-10 leading-relaxed"
    >
      Survival. Logic. Algorithms. Master the geometry of escape in an infinite,
      procedurally generated labyrinth where every step is a calculation.
    </p>

    <!-- CTA buttons -->
    <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
      <button
        id="hero-start-btn"
        onclick={() => (showModal = true)}
        class="group relative px-10 py-4 bg-primary text-on-primary font-bold uppercase tracking-widest text-sm overflow-hidden transition-all hover:bg-primary-container"
      >
        <span class="relative z-10">START MISSION</span>
        <div
          class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"
        ></div>
      </button>

      <button
        id="hero-view-algo-btn"
        onclick={scrollToAI}
        class="px-10 py-4 border border-outline text-white font-bold uppercase tracking-widest text-sm hover:bg-white/5 transition-colors"
      >
        VIEW ALGORITHMS
      </button>
    </div>
  </div>

  <!-- Scanline overlay -->
  <div class="scanline-overlay absolute inset-0 z-40" aria-hidden="true"></div>
  <div class="hero-bottom-fade" aria-hidden="true"></div>
</section>

<!-- ═══════════════════ MISSION CONFIG MODAL ═══════════════════════════════ -->
{#if showModal}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    onclick={(e) => {
      if (e.target === e.currentTarget) showModal = false;
    }}
    onkeydown={(e) => e.key === "Escape" && (showModal = false)}
    role="dialog"
    aria-modal="true"
    aria-label="Mission Configuration"
    tabindex="-1"
  >
    <div
      class="mission-modal w-full max-w-3xl"
      style="--accent: {activeBiomeColor()}"
    >
      <!-- ── Header ───────────────────────────────────────────────────── -->
      <div class="modal-header">
        <div>
          <p class="modal-eyebrow">TACTICAL INTERFACE / MISSION SETUP</p>
          <h3 class="modal-title">
            CONFIGURE<br /><span class="modal-title-accent">YOUR MISSION</span>
          </h3>
        </div>
        <button
          onclick={() => (showModal = false)}
          class="modal-close"
          aria-label="Close">[ESC] ✕</button
        >
      </div>

      <!-- ── Body ─────────────────────────────────────────────────────── -->
      <div class="modal-body">
        <div class="config-section">
          <p class="config-label">OPERATOR IDENT</p>
          <input
            id="player-name-input"
            class="operator-input"
            bind:value={playerName}
            maxlength="24"
            placeholder="Enter your name"
            autocomplete="nickname"
            onkeydown={(e) => e.key === "Enter" && confirmMission()}
          />
          {#if startError}
            <p class="start-error">{startError}</p>
          {/if}
        </div>

        <!-- THREAT LEVEL -->
        <div class="config-section">
          <p class="config-label">THREAT LEVEL</p>
          <div class="threat-grid">
            {#each difficulties as diff}
              <button
                id="threat-{diff.id}"
                class="threat-card {selectedDifficulty === diff.id
                  ? 'threat-card--active'
                  : ''}"
                style="--card-color: {diff.color}"
                onclick={() => (selectedDifficulty = diff.id)}
              >
                <span class="threat-name" style="color: {diff.color}"
                  >{diff.label}</span
                >
                <span class="threat-sub">{diff.sub}</span>
                {#if selectedDifficulty === diff.id}
                  <div class="threat-indicator"></div>
                {/if}
              </button>
            {/each}
          </div>
        </div>

        <!-- SECTOR ENVIRONMENT -->
        <div class="config-section">
          <p class="config-label">SECTOR ENVIRONMENT</p>
          <div class="biome-grid">
            {#each biomes as b}
              <button
                id="biome-{b.id}"
                class="biome-card {selectedBiome === b.id
                  ? 'biome-card--active'
                  : ''}"
                style="--card-color: {b.color}"
                onclick={() => { selectedBiome = b.id; showBiomeDemo = true; }}
              >
                <div class="biome-top">
                  <span class="biome-code" style="color:{b.color}"
                    >{b.code}</span
                  >
                  <span
                    class="biome-gimmick"
                    style="border-color:{b.color}40; color:{b.color}"
                    >{b.gimmick}</span
                  >
                </div>
                <p class="biome-name" style="color:{b.color}">{b.label}</p>
                <p class="biome-desc">{b.desc}</p>
                {#if selectedBiome === b.id}
                  <div
                    class="biome-indicator"
                    style="background:{b.color}"
                  ></div>
                {/if}
              </button>
            {/each}

            <!-- SHUFFLE card -->
            <button
              id="biome-shuffle"
              class="biome-card {selectedBiome === 'shuffle'
                ? 'biome-card--active'
                : ''}"
              style="--card-color: {shuffle.color}"
              onclick={() => { selectedBiome = "shuffle"; showBiomeDemo = true; }}
            >
              <div class="biome-top">
                <span class="biome-code" style="color:{shuffle.color}"
                  >{shuffle.code}</span
                >
                <span
                  class="biome-gimmick"
                  style="border-color:{shuffle.color}40; color:{shuffle.color}"
                  >{shuffle.gimmick}</span
                >
              </div>
              <p class="biome-name" style="color:{shuffle.color}">
                {shuffle.label}
              </p>
              <p class="biome-desc">{shuffle.desc}</p>
              {#if selectedBiome === "shuffle"}
                <div
                  class="biome-indicator"
                  style="background:{shuffle.color}"
                ></div>
              {/if}
            </button>
          </div>

          <!-- ── Biome Demo Panel ─────────────────────────────────────── -->
          {#if showBiomeDemo}
            <div class="biome-demo-wrap">
              <BiomeDemo
                biomeId={selectedBiome}
                color={activeBiomeColor()}
                onClose={() => (showBiomeDemo = false)}
              />
            </div>
          {/if}
        </div>
      </div>

      <!-- ── Footer ───────────────────────────────────────────────────── -->
      <div class="modal-footer">
        <button onclick={() => (showModal = false)} class="modal-cancel"
          >← ABORT</button
        >
        <button
          id="confirm-mission-btn"
          onclick={confirmMission}
          class="modal-confirm"
          style="background: var(--accent)"
          disabled={isStarting}
        >
          {isStarting ? "REGISTERING..." : "DEPLOY MISSION"}
          <span class="modal-confirm-arrow">→</span>
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .hero-section {
    background: #111315;
  }

  .hero-bottom-fade {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 170px;
    z-index: 41;
    pointer-events: none;
    background: linear-gradient(
      180deg,
      rgba(17, 19, 21, 0) 0%,
      rgba(12, 15, 16, 0.62) 55%,
      #080a0c 100%
    );
  }
  /* ── Modal shell ──────────────────────────────────────────────────────── */
  .mission-modal {
    background: rgba(8, 8, 14, 0.97);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-top: 2px solid var(--accent, #4edea3);
    box-shadow:
      0 0 60px rgba(0, 0, 0, 0.9),
      0 0 30px color-mix(in srgb, var(--accent, #4edea3) 20%, transparent);
    animation: modal-in 0.25s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  @keyframes modal-in {
    from {
      opacity: 0;
      transform: scale(0.94) translateY(12px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  /* ── Header ───────────────────────────────────────────────────────────── */
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 28px 32px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  .modal-eyebrow {
    font-family: "Outfit", sans-serif;
    font-size: 9px;
    letter-spacing: 0.22em;
    color: rgba(255, 255, 255, 0.3);
    text-transform: uppercase;
    margin: 0 0 6px;
  }
  .modal-title {
    font-family: "Outfit", sans-serif;
    font-size: clamp(22px, 3vw, 30px);
    font-weight: 900;
    color: #fff;
    line-height: 1;
    text-transform: uppercase;
    letter-spacing: -0.02em;
    margin: 0;
  }
  .modal-title-accent {
    color: var(--accent, #4edea3);
  }
  .modal-close {
    font-family: "Outfit", sans-serif;
    font-size: 10px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.3);
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 4px 0;
    transition: color 0.2s;
  }
  .modal-close:hover {
    color: #fff;
  }

  /* ── Body ─────────────────────────────────────────────────────────────── */
  .modal-body {
    padding: 24px 32px;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }
  .operator-input {
    width: 100%;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-left: 2px solid var(--accent, #4edea3);
    color: #fff;
    font-family: "Outfit", sans-serif;
    font-size: 15px;
    font-weight: 800;
    letter-spacing: 0.08em;
    padding: 14px 16px;
    text-transform: uppercase;
    outline: none;
  }
  .operator-input:focus {
    border-color: var(--accent, #4edea3);
    box-shadow: 0 0 18px
      color-mix(in srgb, var(--accent, #4edea3) 24%, transparent);
  }
  .operator-input::placeholder {
    color: rgba(255, 255, 255, 0.28);
    text-transform: uppercase;
  }
  .start-error {
    margin: 8px 0 0;
    color: #ff5f7a;
    font-family: "Outfit", sans-serif;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .config-label {
    font-family: "Outfit", sans-serif;
    font-size: 9px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.35);
    margin: 0 0 12px;
  }

  /* ── THREAT cards ─────────────────────────────────────────────────────── */
  .threat-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  .threat-card {
    position: relative;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.07);
    padding: 16px 14px;
    cursor: pointer;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 4px;
    transition:
      border-color 0.2s,
      background 0.2s;
    overflow: hidden;
  }
  .threat-card:hover {
    border-color: color-mix(in srgb, var(--card-color) 50%, transparent);
    background: color-mix(in srgb, var(--card-color) 8%, transparent);
  }
  .threat-card--active {
    border-color: var(--card-color) !important;
    background: color-mix(
      in srgb,
      var(--card-color) 12%,
      transparent
    ) !important;
  }
  .threat-name {
    font-family: "Outfit", sans-serif;
    font-size: 15px;
    font-weight: 900;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .threat-sub {
    font-family: "Outfit", sans-serif;
    font-size: 9px;
    color: rgba(255, 255, 255, 0.4);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .threat-indicator {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--card-color);
  }

  /* ── BIOME cards ──────────────────────────────────────────────────────── */
  .biome-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 0;
  }

  /* ── Biome Demo Panel wrapper ─────────────────────────────────────────── */
  .biome-demo-wrap {
    margin-top: 10px;
  }
  @media (min-width: 600px) {
    .biome-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }
  .biome-card {
    position: relative;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.07);
    padding: 14px 12px;
    cursor: pointer;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 5px;
    transition:
      border-color 0.2s,
      background 0.2s;
    overflow: hidden;
  }
  .biome-card:hover {
    border-color: color-mix(in srgb, var(--card-color) 50%, transparent);
    background: color-mix(in srgb, var(--card-color) 8%, transparent);
  }
  .biome-card--active {
    border-color: var(--card-color) !important;
    background: color-mix(
      in srgb,
      var(--card-color) 12%,
      transparent
    ) !important;
  }
  .biome-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
    flex-wrap: wrap;
  }
  .biome-code {
    font-family: "Outfit", sans-serif;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.1em;
  }
  .biome-gimmick {
    font-family: "Outfit", sans-serif;
    font-size: 7px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    border: 1px solid;
    padding: 1px 5px;
    white-space: nowrap;
  }
  .biome-name {
    font-family: "Outfit", sans-serif;
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 0;
    line-height: 1.2;
  }
  .biome-desc {
    font-family: "Outfit", sans-serif;
    font-size: 9px;
    color: rgba(255, 255, 255, 0.4);
    margin: 0;
    line-height: 1.4;
  }
  .biome-indicator {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
  }

  /* ── Footer ───────────────────────────────────────────────────────────── */
  .modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 32px 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }
  .modal-cancel {
    font-family: "Outfit", sans-serif;
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.3);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: color 0.2s;
    padding: 0;
  }
  .modal-cancel:hover {
    color: #fff;
  }
  .modal-confirm {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 32px;
    border: none;
    font-family: "Outfit", sans-serif;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #000;
    cursor: pointer;
    transition:
      filter 0.2s,
      transform 0.15s;
  }
  .modal-confirm:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }
  .modal-confirm:disabled {
    cursor: wait;
    opacity: 0.55;
  }
  .modal-confirm-arrow {
    font-size: 16px;
    transition: transform 0.2s;
  }
  .modal-confirm:hover .modal-confirm-arrow {
    transform: translateX(4px);
  }
</style>
