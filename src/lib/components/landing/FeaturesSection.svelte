<!-- FeaturesSection.svelte — Game Core Mechanics grid (4 cards) -->
<script lang="ts">
  const features = [
    {
      icon: 'grid_view',
      title: 'Procedural Generation',
      desc: 'No two escapes are the same. Our recursive backtracker algorithm ensures unique, solvable, and increasingly complex labyrinths every mission.',
      accent: false,
    },
    {
      icon: 'visibility_off',
      title: 'Fog of War',
      desc: 'Limited operational visibility forces reliance on memory and logic. Map the unknown as you navigate through the pitch-black corridors.',
      accent: false,
    },
    {
      icon: 'explosion',
      title: 'Tactical Wall Bombs',
      desc: 'Strategic destruction of maze boundaries. Break the logic when trapped, but use them sparingly—the labyrinth adapts to breaches.',
      accent: false,
    },
    {
      icon: 'diamond',
      title: 'Power Crystal',
      desc: 'Activate to reverse enemy states — afflicted sentinels enter panic mode and flee from the player using Flee BFS, buying precious escape time.',
      accent: true,
    },
  ] as const;
</script>

<section class="py-24 relative overflow-hidden">
  <div class="container mx-auto px-margin relative z-10">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
      <div class="max-w-xl">
        <h2 class="font-display-lg text-4xl font-black text-white mb-4 uppercase tracking-tight">
          Game Core Mechanics
        </h2>
        <p class="text-on-surface-variant">
          Advanced tactical systems integrated for optimal survival and algorithmic mastery.
        </p>
      </div>
      <div class="h-px flex-1 bg-outline-variant mb-3 hidden md:block"></div>
    </div>

    <!-- Features grid — 2 cols on md, 4 on lg -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border border-outline-variant">
      {#each features as feature, i}
        <div
          class="p-8 hover:bg-primary/5 transition-colors group relative
            {i === 0 ? 'border-b md:border-b-0 md:border-r border-outline-variant' : ''}
            {i === 1 ? 'border-b lg:border-b-0 lg:border-r border-outline-variant' : ''}
            {i === 2 ? 'border-b md:border-b-0 md:border-r border-outline-variant' : ''}
          "
        >
          <div
            class="size-12 flex items-center justify-center mb-6 transition-all border
              {feature.accent
                ? 'border-secondary group-hover:bg-secondary group-hover:text-on-secondary'
                : 'border-primary group-hover:bg-primary group-hover:text-on-primary'}"
          >
            <span class="material-symbols-outlined" style="font-size: 28px;">{feature.icon}</span>
          </div>

          <h3 class="font-headline-md text-white mb-4 text-lg font-bold">{feature.title}</h3>
          <p class="text-sm text-on-surface-variant leading-relaxed mb-6">{feature.desc}</p>

          <div class="font-label-caps text-[10px] tracking-widest uppercase {feature.accent ? 'text-secondary' : 'text-primary'}">
            {feature.accent ? 'Flee BFS Active' : 'Module Active'}
          </div>

          {#if feature.accent}
            <div class="absolute top-3 right-3 size-2 bg-secondary rounded-full animate-pulse shadow-[0_0_8px_#ffb95f]"></div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</section>
