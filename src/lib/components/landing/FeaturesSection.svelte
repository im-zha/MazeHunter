<!-- FeaturesSection.svelte — Game Core Mechanics grid -->
<script lang="ts">
  const features = [
    {
      icon: 'grid_view',
      title: 'Procedural Generation',
      desc: 'No two escapes are the same. Our recursive backtracker algorithm ensures unique, solvable, and increasingly complex labyrinths every mission.',
    },
    {
      icon: 'visibility_off',
      title: 'Fog of War',
      desc: 'Limited operational visibility forces reliance on memory and logic. Map the unknown as you navigate through the pitch-black corridors.',
    },
    {
      icon: 'explosion',
      title: 'Tactical Wall Bombs',
      desc: 'Strategic destruction of maze boundaries. Break the logic when trapped, but use them sparingly—the labyrinth adapts to breaches.',
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
      <div class="h-[1px] flex-1 bg-outline-variant mb-3 hidden md:block"></div>
    </div>

    <!-- Features grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-0 border border-outline-variant">
      {#each features as feature, i}
        <div
          class="p-8 hover:bg-primary/5 transition-colors group
            {i < features.length - 1 ? 'border-b md:border-b-0 md:border-r border-outline-variant' : ''}"
        >
          <div class="size-12 border border-primary flex items-center justify-center mb-6
            group-hover:bg-primary group-hover:text-on-primary transition-all">
            <span class="material-symbols-outlined" style="font-size: 28px;">{feature.icon}</span>
          </div>
          <h3 class="font-headline-md text-white mb-4 text-lg font-bold">{feature.title}</h3>
          <p class="text-sm text-on-surface-variant leading-relaxed mb-6">{feature.desc}</p>
          <div class="font-label-caps text-[10px] text-primary tracking-widest uppercase">Module Active</div>
        </div>
      {/each}
    </div>
  </div>
</section>
