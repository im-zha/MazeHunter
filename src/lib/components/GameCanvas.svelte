<!-- GameCanvas.svelte — Binds canvas ref to GameLoop -->
<script lang="ts">
  import { GameLoop } from '$lib/systems/game-loop.js';

  let canvas: HTMLCanvasElement;
  let gameLoop: GameLoop;

  $effect(() => {
    gameLoop = new GameLoop(canvas);
    gameLoop.start();
    return () => {
      gameLoop?.stop();
    };
  });

  // Svelte 5 runes mode: expose methods via exported functions (component exports)
  export const pause    = () => gameLoop?.pause();
  export const resume   = () => gameLoop?.resume();
  export const restart  = () => gameLoop?.restart();
  export const loadGame = (s: any) => gameLoop?.loadState(s);
</script>

<canvas
  bind:this={canvas}
  class="block"
  style="image-rendering: pixelated;"
  aria-label="Maze Hunter game canvas"
></canvas>
