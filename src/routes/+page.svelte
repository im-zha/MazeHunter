<!-- src/routes/+page.svelte — Landing Page -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  import LandingHeader   from '$lib/components/landing/LandingHeader.svelte';
  import HeroSection     from '$lib/components/landing/HeroSection.svelte';
  import MainMenuSection from '$lib/components/landing/MainMenuSection.svelte';
  import FeaturesSection from '$lib/components/landing/FeaturesSection.svelte';
  import AIArchetypes    from '$lib/components/landing/AIArchetypes.svelte';
  import LandingFooter   from '$lib/components/landing/LandingFooter.svelte';

  let hasSave = $state(false);

  onMount(() => {
    hasSave = !!localStorage.getItem('mazehunter_save');
  });

  function startGame() {
    goto('/game');
  }

  function continueGame() {
    goto('/game?load=true');
  }

  function startEndless() {
    goto('/game?mode=endless');
  }
</script>

<svelte:head>
  <title>Maze Hunter — Tactical Command</title>
  <meta
    name="description"
    content="A procedurally generated maze survival game where enemies use real graph-search algorithms — BFS, Dijkstra, A*, and DFS — to hunt you down."
  />
</svelte:head>

<style>
  :global(body) {
    background: #131315;
    color: #e5e1e4;
    font-family: 'Inter', sans-serif;
    overflow-x: hidden;
  }
</style>

<div class="relative">
  <LandingHeader />

  <main>
    <HeroSection onStartGame={startGame} />

    <MainMenuSection
      {hasSave}
      onNewGame={startGame}
      onContinue={continueGame}
      onEndless={startEndless}
    />

    <FeaturesSection />

    <AIArchetypes />
  </main>

  <LandingFooter />
</div>
