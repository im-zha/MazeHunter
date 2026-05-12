<!-- HeroSection.svelte — Full-screen hero with maze background -->
<script lang="ts">
  interface Props {
    onStartGame: (difficulty: 'easy' | 'medium' | 'hard') => void;
  }
  let { onStartGame }: Props = $props();

  /** Controls whether the difficulty picker is visible */
  let showDifficultyModal = $state(false);

  function scrollToAI() {
    document.getElementById('ai-archetypes')?.scrollIntoView({ behavior: 'smooth' });
  }

  function pickDifficulty(level: 'easy' | 'medium' | 'hard') {
    showDifficultyModal = false;
    onStartGame(level);
  }
</script>

<section class="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
  <!-- Maze Background with Fog -->
  <div class="absolute inset-0 z-0">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#131315_70%)] z-10"></div>
    <div class="absolute inset-0 bg-background/40 z-20"></div>
    <div
      class="w-full h-full opacity-30 grayscale"
      style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuBOmQKkeZh3TWkENXsM8qCd_wOI0L8lRMsAKceGnJxSqkov71OsPXKYqO5dwy_-CM05K7ujzS5rUcbGEO4NPm8ZTbD8ynZ0R7EKHQWvrJnfB6Ib9MdiIm3QwcoY52bu8A0lSAHaqhPgduDGnv7x1hLTO0J9uZzl-zQzWp0tdwqibouxNf6UgAzcRdJ8JuQ9nhc0ycqzPNE0YkSsM7EoHPlw3cNdl_fmDGPM6h8O4NNDY2UrS4f0adEwudm69WKjtKIRYi9nQJStPIbg'); background-size: cover; background-position: center;"
      aria-hidden="true"
    ></div>
    <!-- Player dot -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30" aria-hidden="true">
      <div class="size-6 bg-primary rounded-sm rotate-45 animate-pulse shadow-[0_0_20px_#4edea3]"></div>
    </div>
  </div>

  <!-- Content -->
  <div class="relative z-30 container mx-auto px-margin text-center">
    <div class="inline-block mb-6 px-3 py-1 border border-primary/30 bg-primary/5">
      <span class="font-label-caps text-xs text-primary tracking-widest uppercase">Encryption Level: Maximum</span>
    </div>

    <h2 class="text-7xl md:text-9xl font-display-lg font-black tracking-tighter text-white mb-4 italic select-none">
      MAZE<br /><span class="text-primary text-glow">HUNTER</span>
    </h2>

    <p class="max-w-2xl mx-auto font-body-md text-lg text-on-surface-variant mb-10 leading-relaxed">
      Survival. Logic. Algorithms. Master the geometry of escape in an infinite,
      procedurally generated labyrinth where every step is a calculation.
    </p>

    <!-- CTA buttons -->
    {#if !showDifficultyModal}
      <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <!-- START MISSION: opens difficulty picker -->
        <button
          id="hero-start-btn"
          onclick={() => (showDifficultyModal = true)}
          class="group relative px-10 py-4 bg-primary text-on-primary font-bold uppercase tracking-widest text-sm overflow-hidden transition-all hover:bg-primary-container"
        >
          <span class="relative z-10">START MISSION</span>
          <div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
        </button>

        <!-- VIEW ALGORITHMS: smooth-scrolls to AI section -->
        <button
          id="hero-view-algo-btn"
          onclick={scrollToAI}
          class="px-10 py-4 border border-outline text-white font-bold uppercase tracking-widest text-sm hover:bg-white/5 transition-colors"
        >
          VIEW ALGORITHMS
        </button>
      </div>
    {:else}
      <!-- Difficulty picker (replaces CTA row) -->
      <div class="flex flex-col items-center gap-4 animate-fade-in">
        <p class="font-label-caps text-xs text-primary tracking-widest uppercase mb-2">
          Select Difficulty Level
        </p>
        <div class="flex flex-col sm:flex-row gap-3">
          <button
            id="diff-easy-btn"
            onclick={() => pickDifficulty('easy')}
            class="px-10 py-4 bg-primary/20 border border-primary/50 text-primary font-bold uppercase tracking-widest text-sm hover:bg-primary hover:text-on-primary transition-all"
          >
            EASY
          </button>
          <button
            id="diff-medium-btn"
            onclick={() => pickDifficulty('medium')}
            class="px-10 py-4 bg-secondary/20 border border-secondary/50 text-secondary font-bold uppercase tracking-widest text-sm hover:bg-secondary hover:text-on-secondary transition-all"
          >
            MEDIUM
          </button>
          <button
            id="diff-hard-btn"
            onclick={() => pickDifficulty('hard')}
            class="px-10 py-4 bg-tertiary/20 border border-tertiary/50 text-tertiary font-bold uppercase tracking-widest text-sm hover:bg-tertiary hover:text-on-tertiary transition-all"
          >
            HARD
          </button>
        </div>
        <button
          onclick={() => (showDifficultyModal = false)}
          class="font-label-caps text-[10px] text-outline uppercase tracking-widest hover:text-white transition-colors mt-1"
        >
          ← CANCEL
        </button>
      </div>
    {/if}
  </div>

  <!-- Scanline overlay -->
  <div class="scanline-overlay absolute inset-0 z-40" aria-hidden="true"></div>
</section>
