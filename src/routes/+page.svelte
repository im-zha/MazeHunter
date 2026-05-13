<!-- src/routes/+page.svelte — Landing Page -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { sessionConfig } from '$lib/stores/session-config.js';
  import type { BiomeId, Difficulty } from '$lib/core/types.js';

  import LandingHeader   from '$lib/components/landing/LandingHeader.svelte';
  import HeroSection     from '$lib/components/landing/HeroSection.svelte';
  import MainMenuSection from '$lib/components/landing/MainMenuSection.svelte';
  import FeaturesSection from '$lib/components/landing/FeaturesSection.svelte';
  import AIArchetypes    from '$lib/components/landing/AIArchetypes.svelte';
  import LandingFooter   from '$lib/components/landing/LandingFooter.svelte';
  import FieldManualModal from '$lib/components/landing/FieldManualModal.svelte';

  let hasSave = $state(false);
  let showFieldManual = $state(false);

  onMount(() => {
    hasSave = !!localStorage.getItem('mazehunter_save');
  });

  async function startGame(difficulty: Difficulty, biome: BiomeId) {
    sessionConfig.set({ difficulty, biome });
    await goto('/game');
  }

  function continueGame() {
    goto('/game?load=true');
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

  .landing-page {
    background: linear-gradient(
      180deg,
      #111315 0%,
      #080a0c 32%,
      #111315 56%,
      #141617 76%,
      #07090a 100%
    );
  }
</style>

<div class="landing-page relative">
  <LandingHeader />

  <main>
    <HeroSection onStartGame={startGame} />

    <MainMenuSection
      {hasSave}
      onContinue={continueGame}
      onLeaderboard={() => goto('/leaderboard')}
      onHowToPlay={() => (showFieldManual = true)}
    />

    <FeaturesSection />

    <AIArchetypes />
  </main>

  <LandingFooter />

  {#if showFieldManual}
    <FieldManualModal onClose={() => (showFieldManual = false)} />
  {/if}
</div>
