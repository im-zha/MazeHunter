<!-- AIArchetypes.svelte — Enemy AI archetypes showcase with algo modal -->
<script lang="ts">
  interface Archetype {
    name: string;
    algo: string;
    algoFull: string;
    color: string;
    borderColor: string;
    badgeBg: string;
    badgeBorder: string;
    panelBg: string;
    desc: string;
    img: string;
    modalTitle: string;
    modalBody: string;
    complexity: string;
    useCase: string;
  }

  const archetypes: Archetype[] = [
    {
      name: 'Ghost',
      algo: 'BFS',
      algoFull: 'Breadth-First Search',
      color: 'blue-400',
      borderColor: '#60a5fa',
      badgeBg: 'rgba(96,165,250,0.2)',
      badgeBorder: 'rgba(96,165,250,0.3)',
      panelBg: 'rgba(30,58,138,0.2)',
      desc: 'Breadth-First Search logic. Explores all adjacent paths equally. Slow but thorough—it will eventually find you if you stay still.',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCjqHOeNGndWXz8ir1a7SPu4w9qaWDtAQutnc0_mXdFD6Oxq-yebRQPjPmE0v9S_L9BvLxbbf0fNzih8yeBu6DLefhncnpGvQ2K0EzCfxqdKUnhyF76podSbESK4T3allvqCSm8lX-Xfvz6l42B9dzs1rv945vR4oHTxCzGz24_8bOvPlEDTZT-prDcvFkm4XpNKnNUCQa0bUo3lerzGKdf65JmlYzsLQKeLEKv_jwJD2qpgIIl2ihljNDYfLRMcqAymUezxdHrrNn4',
      modalTitle: 'BFS — Breadth-First Search',
      modalBody:
        'BFS explores every node at the current "depth" before moving deeper. It uses a FIFO queue to track the frontier. In an unweighted maze, BFS guarantees the shortest path to the player — but it is slow and memory-intensive because it stores all frontier nodes simultaneously.',
      complexity: 'O(V + E)',
      useCase: 'Guarantees shortest path · Unweighted graphs',
    },
    {
      name: 'Heavy',
      algo: 'Dijkstra',
      algoFull: "Dijkstra's Algorithm",
      color: 'secondary',
      borderColor: '#ffb95f',
      badgeBg: 'rgba(255,185,95,0.2)',
      badgeBorder: 'rgba(255,185,95,0.3)',
      panelBg: 'rgba(255,185,95,0.1)',
      desc: 'Calculates the shortest path through weighted obstacles. Powerful but predictable. Avoid its optimized charge.',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHO1J_pUUG3ZBt7bsptae0N0nISvH3qPFItx8wfozymYFC9tFK-IdaTHvFDZTIH_bjL3kTlgL6CmzNsncgMfv7Cl7fuJ3N4_oZCqJ7-AgIhrzsQwD2oe2KViNuCJ87FPKgMqdtmm_ezq7Zq5OSvaBEPazFBhAfamSu3Jk9cWJU7KgCcngf97C5DP6tLxI2DwuyPQEuvtwrqIJNREASK9RIa3Cz9CiK6hSDOjw0kfTP07cJGv8NsNgOuxzsU-YsgmKx8oBAwRNoVwRK',
      modalTitle: "Dijkstra's Algorithm",
      modalBody:
        "Dijkstra extends BFS to weighted graphs. It uses a min-priority queue and always expands the node with the lowest cumulative cost. In Maze Hunter, Heavy treats each corridor segment as having variable weight (based on bomb damage, terrain, etc.), giving it a more deliberate but devastating charge path.",
      complexity: 'O((V + E) log V)',
      useCase: 'Shortest path · Weighted graphs',
    },
    {
      name: 'Hunter',
      algo: 'A-Star',
      algoFull: 'A* (A-Star) Search',
      color: 'primary',
      borderColor: '#4edea3',
      badgeBg: 'rgba(78,222,163,0.2)',
      badgeBorder: 'rgba(78,222,163,0.3)',
      panelBg: 'rgba(78,222,163,0.1)',
      desc: 'Heuristic-driven pursuit. It guesses where you are going and cuts you off. The most dangerous tactical adversary in the maze.',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCR5rP4ln5iDtu6LoJ4-obfjLk9-P1TWdgeq2YpPTyJKWaV0CbF0Cvu7qHKl0zPnAwfoWjZwAiJSK_hfilkk5R_BLKszNMs5I1z9xQaLvf8FF3sud6CNLt92vYTWjE69z5KJt0MSC09h2mhUrl_x7ts3VIOcnCsI42hc9AA4JFTD8IMwNkjXjrkwNmlaUatFABROYW-0bEYgwLdiz5twzsFaT1QoSS7L19hne6Lir70pMrTuASqtOsxlDk3qfuIbNhC2v28VEZuDJoT',
      modalTitle: 'A* — Heuristic Search',
      modalBody:
        'A* combines Dijkstra\'s guaranteed optimality with a heuristic function h(n) — typically Manhattan distance — to guide the search toward the goal. Its evaluation function f(n) = g(n) + h(n) makes it dramatically faster than Dijkstra in practice, which is why Hunter intercepts rather than merely follows.',
      complexity: 'O(E · log V) with admissible heuristic',
      useCase: 'Optimal & informed · Best general-purpose pathfinder',
    },
    {
      name: 'Shadow',
      algo: 'DFS',
      algoFull: 'Depth-First Search',
      color: 'tertiary',
      borderColor: '#ffb3ad',
      badgeBg: 'rgba(255,179,173,0.2)',
      badgeBorder: 'rgba(255,179,173,0.3)',
      panelBg: 'rgba(255,179,173,0.1)',
      desc: 'Depth-First Search recursion. Follows one path to its absolute end before turning back. Erratic and hard to track in deep corridors.',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA7Zjb2lIdpjFlrt5XSLSJJBJp649yRoBbdds9LYBLnFoj_vjh0q2psoUS8RBe-oQTJOyUbzIaB5VIrj7UgYXrXYK448T55j_e24wwx9eOh92-xVYRRBtKq8ZjKUW6egOi8wmDa1GGg0LQ95K6QONaMg6nph1mhAxFm11MOLxks7MkzOnnhp2ebRaI_YApkADfyzBUyNgxBtjJ13iyzTmfFFgR1E4TnndoSb6whgMNyWqpFzd0UL3',
      modalTitle: 'DFS — Depth-First Search',
      modalBody:
        'DFS dives as deep as possible along a single branch before backtracking. It uses a LIFO stack (or recursion). In the maze, Shadow commits fully to each corridor until it hits a dead end, making its movement chaotic and hard to predict — especially in corridors with many branches.',
      complexity: 'O(V + E)',
      useCase: 'Explores deep paths · Unpredictable in branching mazes',
    },
  ];

  /** Currently selected archetype for the modal (null = closed) */
  let selectedAlgo = $state<Archetype | null>(null);

  function openModal(archetype: Archetype) {
    selectedAlgo = archetype;
  }

  function closeModal() {
    selectedAlgo = null;
  }

  function handleKeydown(e: KeyboardEvent, archetype: Archetype) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openModal(archetype);
    }
  }

  function handleModalKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') closeModal();
  }
</script>

<section id="ai-archetypes" class="py-24 bg-surface-container-low">
  <div class="container mx-auto px-margin">
    <div class="text-center mb-16">
      <h2 class="font-display-lg text-4xl font-black text-white mb-4 uppercase tracking-tight">
        AI Archetypes
      </h2>
      <p class="text-on-surface-variant max-w-xl mx-auto">
        Know your enemy. Each sentinel follows a specific pathfinding algorithm to hunt you down.
      </p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {#each archetypes as archetype}
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div
          role="button"
          tabindex="0"
          class="tactical-panel overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-300"
          style="border-top: 2px solid {archetype.borderColor};"
          onclick={() => openModal(archetype)}
          onkeydown={(e) => handleKeydown(e, archetype)}
          aria-label="View {archetype.name} ({archetype.algo}) algorithm details"
        >
          <!-- Card image -->
          <div
            class="h-40 relative"
            style="background-image: url('{archetype.img}'); background-size: cover; background-position: center; background-color: {archetype.panelBg};"
            aria-hidden="true"
          >
            <div class="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
          </div>

          <!-- Card body -->
          <div class="p-6">
            <div class="flex justify-between items-center mb-4">
              <h4 class="font-bold text-lg text-white uppercase tracking-tighter">{archetype.name}</h4>
              <span
                class="font-label-caps text-[10px] px-2 py-0.5 border"
                style="background:{archetype.badgeBg}; color:{archetype.borderColor}; border-color:{archetype.badgeBorder};"
              >{archetype.algo}</span>
            </div>
            <p class="text-sm text-on-surface-variant leading-relaxed">{archetype.desc}</p>
            <p class="mt-3 font-label-caps text-[10px] tracking-widest uppercase" style="color:{archetype.borderColor}">
              Click to learn more →
            </p>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- Algorithm Detail Modal -->
{#if selectedAlgo}
  <!-- Backdrop -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
    onclick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
    onkeydown={handleModalKeydown}
    role="dialog"
    aria-modal="true"
    aria-label="{selectedAlgo.modalTitle} details"
    tabindex="-1"
  >
    <div
      class="tactical-panel max-w-lg w-full p-8 relative animate-scale-in"
      style="border-top: 3px solid {selectedAlgo.borderColor}; box-shadow: 0 0 40px {selectedAlgo.borderColor}22;"
    >
      <!-- Close -->
      <button
        onclick={closeModal}
        class="absolute top-4 right-4 text-outline hover:text-white transition-colors font-label-caps text-xs uppercase tracking-widest"
        aria-label="Close modal"
      >
        [ESC] ✕
      </button>

      <!-- Header -->
      <div class="mb-6">
        <span
          class="font-label-caps text-[10px] px-2 py-0.5 border inline-block mb-3"
          style="background:{selectedAlgo.badgeBg}; color:{selectedAlgo.borderColor}; border-color:{selectedAlgo.badgeBorder};"
        >
          {selectedAlgo.algo}
        </span>
        <h3 class="font-display-lg text-2xl font-black text-white uppercase tracking-tight">
          {selectedAlgo.name}
        </h3>
        <p class="font-label-caps text-xs text-on-surface-variant mt-1">{selectedAlgo.algoFull}</p>
      </div>

      <!-- Body -->
      <p class="text-sm text-on-surface-variant leading-relaxed mb-6">
        {selectedAlgo.modalBody}
      </p>

      <!-- Stats -->
      <div class="border border-outline-variant p-4 font-data-sm text-[11px] space-y-2">
        <div class="flex justify-between">
          <span class="text-outline uppercase">Complexity</span>
          <span class="text-white">{selectedAlgo.complexity}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-outline uppercase">Best For</span>
          <span class="text-white">{selectedAlgo.useCase}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-outline uppercase">Archetype</span>
          <span style="color:{selectedAlgo.borderColor}">{selectedAlgo.name}</span>
        </div>
      </div>

      <button
        onclick={closeModal}
        class="mt-6 w-full py-3 border font-bold uppercase tracking-widest text-sm transition-all hover:bg-primary/10 hover:border-primary"
        style="border-color:{selectedAlgo.borderColor}; color:{selectedAlgo.borderColor};"
      >
        UNDERSTOOD
      </button>
    </div>
  </div>
{/if}

<style>
  @keyframes scale-in {
    from { opacity: 0; transform: scale(0.92); }
    to   { opacity: 1; transform: scale(1); }
  }
  .animate-scale-in {
    animation: scale-in 0.2s ease-out both;
  }
</style>
