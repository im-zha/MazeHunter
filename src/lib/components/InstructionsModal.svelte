<!-- src/lib/components/InstructionsModal.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  const dispatch = createEventDispatcher();

  function close() {
    dispatch('close');
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      close();
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="overlay" role="dialog" aria-modal="true" aria-label="How to Play" tabindex="-1" onclick={close}>
  <div class="modal-content" role="presentation" onclick={(e) => e.stopPropagation()}>
    <div class="modal-header">
      <h2 class="modal-title">How To Play</h2>
      <button class="close-btn" aria-label="Close" onclick={close}>✕</button>
    </div>

    <div class="modal-body">
      <section class="info-section">
        <h3>Objective</h3>
        <p>Reach the exit portal before time runs out. Avoid all enemies along the way.</p>
        <p>If an enemy touches you, you lose a life. Run out of lives, and it's Game Over.</p>
      </section>

      <section class="info-section">
        <h3>Controls</h3>
        <ul class="clean-list">
          <li><strong>Move:</strong> WASD or Arrow Keys (Swipe on mobile)</li>
          <li><strong>Place Wall Bomb:</strong> Spacebar (Tap on mobile)</li>
          <li><strong>Pause:</strong> Escape or P, or use the Pause Button</li>
        </ul>
        <p class="hint">Use wall bombs to destroy a wall and clear a path when you are trapped.</p>
      </section>

      <section class="info-section">
        <h3>Enemies</h3>
        <ul class="enemy-list">
          <li><span class="dot ghost"></span><strong>Ghost:</strong> Heads straight toward you (BFS)</li>
          <li><span class="dot heavy"></span><strong>Heavy:</strong> Slower but relentless pursuer (Dijkstra)</li>
          <li><span class="dot hunter"></span><strong>Hunter:</strong> Smartest and fastest tracker (A*)</li>
          <li><span class="dot shadow"></span><strong>Shadow:</strong> Unpredictable pathfinding (DFS)</li>
        </ul>
      </section>

      <section class="info-section borderless">
        <h3>Items & Power-ups</h3>
        <ul class="clean-list items-list">
          <li>⚡ <strong>Power Crystal:</strong> Destroy enemies on contact for a short time.</li>
          <li>🕒 <strong>Freeze Clock:</strong> Freezes all enemies for a few seconds.</li>
          <li>💣 <strong>Bomb Pickup:</strong> Gives you +1 wall bomb.</li>
        </ul>
      </section>
    </div>

    <div class="modal-footer">
      <button class="btn btn-primary" onclick={close}>Got it</button>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(14px);
    z-index: 100;
  }

  .modal-content {
    background: linear-gradient(145deg, #0d0d1f, #1a1a2e);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 0 60px rgba(0, 0, 0, 0.8);
    font-family: 'Outfit', sans-serif;
    color: #fff;
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .modal-title {
    font-size: 24px;
    font-weight: 800;
    margin: 0;
  }

  .close-btn {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    font-size: 20px;
    cursor: pointer;
    transition: color 0.15s;
  }

  .close-btn:hover {
    color: #fff;
  }

  .modal-body {
    padding: 24px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .info-section {
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .info-section.borderless {
    border-bottom: none;
    padding-bottom: 0;
  }

  .info-section h3 {
    font-size: 16px;
    font-weight: 700;
    color: #f72585;
    margin: 0 0 10px 0;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .info-section p {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.5;
    margin: 0 0 8px 0;
  }

  .clean-list {
    list-style: none;
    padding: 0;
    margin: 0;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .items-list li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  .hint {
    margin-top: 10px !important;
    font-size: 13px !important;
    color: rgba(255, 255, 255, 0.5) !important;
    font-style: italic;
  }

  .enemy-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
  }

  .enemy-list li {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .dot.ghost { background: #60a5fa; }
  .dot.heavy { background: #f97316; }
  .dot.hunter { background: #a855f7; }
  .dot.shadow { background: #6b7280; }

  .modal-footer {
    padding: 20px 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    justify-content: flex-end;
  }

  .btn {
    padding: 12px 24px;
    border-radius: 12px;
    border: none;
    font-family: 'Outfit', sans-serif;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .btn:hover { transform: translateY(-2px); }
  .btn:active { transform: translateY(0); }

  .btn-primary {
    background: linear-gradient(135deg, #7b2ff7, #f72585);
    color: #fff;
    box-shadow: 0 4px 20px rgba(123, 47, 247, 0.4);
    width: 100%;
  }
</style>
