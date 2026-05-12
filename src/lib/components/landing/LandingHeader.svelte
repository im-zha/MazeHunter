<!-- LandingHeader.svelte — Fixed HUD nav bar -->
<script lang="ts">
  import { onMount } from 'svelte';

  let statusText = $state('Initializing...');
  let statusColor = $state('text-secondary'); // amber while connecting
  let isOnline = $state(false);

  onMount(() => {
    setTimeout(() => {
      statusText = 'Syncing Data...';
    }, 800);

    setTimeout(() => {
      statusText = 'Online / No Breach';
      statusColor = 'text-primary'; // switch to green
      isOnline = true;
    }, 2200);
  });
</script>

<header class="fixed top-0 left-0 w-full z-50 px-margin py-6 flex justify-between items-start pointer-events-none">
  <!-- Logo -->
  <div class="pointer-events-auto">
    <div class="flex items-center gap-3 border-l-2 border-primary pl-4">
      <div class="text-primary">
        <span class="material-symbols-outlined" style="font-size: 32px;">terminal</span>
      </div>
      <div>
        <h1 class="font-display-lg font-black text-xl tracking-tighter leading-none text-white">MAZE HUNTER</h1>
        <p class="font-label-caps text-[10px] text-primary opacity-80 uppercase">Tactical Interface v1.0.4</p>
      </div>
    </div>
  </div>

  <!-- Status panel -->
  <div class="pointer-events-auto flex flex-col items-end gap-2">
    <div class="tactical-panel px-4 py-2 flex items-center gap-6">
      <div class="flex flex-col items-end transition-all duration-500">
        <span class="font-label-caps text-[9px] uppercase text-outline">System Status</span>
        <span class="{statusColor} font-bold text-[11px] uppercase tracking-wider {isOnline ? '' : 'animate-pulse'}">
          {statusText}
        </span>
      </div>
      <div class="w-[1px] h-6 bg-outline-variant"></div>
      <button class="text-on-surface hover:text-primary transition-colors" aria-label="Open menu">
        <span class="material-symbols-outlined">menu</span>
      </button>
    </div>
  </div>
</header>
