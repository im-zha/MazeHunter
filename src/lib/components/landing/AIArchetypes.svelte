<!-- AIArchetypes.svelte — Enemy AI archetypes showcase -->
<script lang="ts">
  const archetypes = [
    {
      name: 'Ghost',
      algo: 'BFS',
      color: 'blue-400',
      borderColor: '#60a5fa',
      badgeBg: 'rgba(96,165,250,0.2)',
      badgeBorder: 'rgba(96,165,250,0.3)',
      panelBg: 'rgba(30,58,138,0.2)',
      desc: 'Breadth-First Search logic. Explores all adjacent paths equally. Slow but thorough—it will eventually find you if you stay still.',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCjqHOeNGndWXz8ir1a7SPu4w9qaWDtAQutnc0_mXdFD6Oxq-yebRQPjPmE0v9S_L9BvLxbbf0fNzih8yeBu6DLefhncnpGvQ2K0EzCfxqdKUnhyF76podSbESK4T3allvqCSm8lX-Xfvz6l42B9dzs1rv945vR4oHTxCzGz24_8bOvPlEDTZT-prDcvFkm4XpNKnNUCQa0bUo3lerzGKdf65JmlYzsLQKeLEKv_jwJD2qpgIIl2ihljNDYfLRMcqAymUezxdHrrNn4',
    },
    {
      name: 'Heavy',
      algo: 'Dijkstra',
      color: 'secondary',
      borderColor: '#ffb95f',
      badgeBg: 'rgba(255,185,95,0.2)',
      badgeBorder: 'rgba(255,185,95,0.3)',
      panelBg: 'rgba(255,185,95,0.1)',
      desc: 'Calculates the shortest path through weighted obstacles. Powerful but predictable. Avoid its optimized charge.',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHO1J_pUUG3ZBt7bsptae0N0nISvH3qPFItx8wfozymYFC9tFK-IdaTHvFDZTIH_bjL3kTlgL6CmzNsncgMfv7Cl7fuJ3N4_oZCqJ7-AgIhrzsQwD2oe2KViNuCJ87FPKgMqdtmm_ezq7Zq5OSvaBEPazFBhAfamSu3Jk9cWJU7KgCcngf97C5DP6tLxI2DwuyPQEuvtwrqIJNREASK9RIa3Cz9CiK6hSDOjw0kfTP07cJGv8NsNgOuxzsU-YsgmKx8oBAwRNoVwRK',
    },
    {
      name: 'Hunter',
      algo: 'A-Star',
      color: 'primary',
      borderColor: '#4edea3',
      badgeBg: 'rgba(78,222,163,0.2)',
      badgeBorder: 'rgba(78,222,163,0.3)',
      panelBg: 'rgba(78,222,163,0.1)',
      desc: 'Heuristic-driven pursuit. It guesses where you are going and cuts you off. The most dangerous tactical adversary in the maze.',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCR5rP4ln5iDtu6LoJ4-obfjLk9-P1TWdgeq2YpPTyJKWaV0CbF0Cvu7qHKl0zPnAwfoWjZwAiJSK_hfilkk5R_BLKszNMs5I1z9xQaLvf8FF3sud6CNLt92vYTWjE69z5KJt0MSC09h2mhUrl_x7ts3VIOcnCsI42hc9AA4JFTD8IMwNkjXjrkwNmlaUatFABROYW-0bEYgwLdiz5twzsFaT1QoSS7L19hne6Lir70pMrTuASqtOsxlDk3qfuIbNhC2v28VEZuDJoT',
    },
    {
      name: 'Shadow',
      algo: 'DFS',
      color: 'tertiary',
      borderColor: '#ffb3ad',
      badgeBg: 'rgba(255,179,173,0.2)',
      badgeBorder: 'rgba(255,179,173,0.3)',
      panelBg: 'rgba(255,179,173,0.1)',
      desc: 'Depth-First Search recursion. Follows one path to its absolute end before turning back. Erratic and hard to track in deep corridors.',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA7Zjb2lIdpjFlrt5XSLSJJBJp649yRoBbdds9LYBLnFoj_vjh0q2psoUS8RBe-oQTJOyUbzIaB5VIrj7UgYXrXYK448T55j_e24wwx9eOh92-xVYRRBtKq8ZjKUW6egOi8wmDa1GGg0LQ95K6QONaMg6nph1mhAxFm11MOLxks7MkzOnnhp2ebRaI_YApkADfyzBUyNgxBtjJ13iyzTmfFFgR1E4TnndoSb6whgMNyWqpFzd0UL3',
    },
  ] as const;
</script>

<section class="py-24 bg-surface-container-low">
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
        <div
          class="tactical-panel overflow-hidden"
          style="border-top: 2px solid {archetype.borderColor};"
        >
          <!-- Card image -->
          <div
            class="h-40 relative"
            style="background-image: url('{archetype.img}'); background-size: cover; background-position: center; background-color: {archetype.panelBg};"
            aria-label="{archetype.name} archetype"
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
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>
