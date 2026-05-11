<!-- HeroSection.svelte — Full-screen hero with maze background -->
<script lang="ts">
  interface Props {
    onStartGame: () => void;
  }
  let { onStartGame }: Props = $props();
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

    <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
      <button
        id="hero-start-btn"
        onclick={onStartGame}
        class="group relative px-10 py-4 bg-primary text-on-primary font-bold uppercase tracking-widest text-sm overflow-hidden transition-all hover:bg-primary-container"
      >
        <span class="relative z-10">START MISSION</span>
        <div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
      </button>
      <button class="px-10 py-4 border border-outline text-white font-bold uppercase tracking-widest text-sm hover:bg-white/5 transition-colors">
        VIEW ALGORITHMS
      </button>
    </div>
  </div>

  <!-- Scroll Indicator -->
  <div class="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 opacity-50" aria-hidden="true">
    <span class="font-label-caps text-[10px] uppercase tracking-[0.2em]">Deploying Modules</span>
    <div class="w-[1px] h-12 bg-gradient-to-b from-primary to-transparent"></div>
  </div>

  <!-- Scanline overlay -->
  <div class="scanline-overlay absolute inset-0 z-40" aria-hidden="true"></div>
</section>
