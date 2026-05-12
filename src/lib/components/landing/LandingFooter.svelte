<!-- LandingFooter.svelte — Tactical footer -->
<footer class="landing-footer py-12">
  <div class="container mx-auto px-margin flex flex-col md:flex-row justify-between items-center gap-8 footer-inner">
    <!-- Branding -->
    <div class="flex items-center gap-3">
      <div class="size-2 bg-primary"></div>
      <span class="font-label-caps text-[10px] uppercase text-outline tracking-widest">
        Maze Hunter Tactical Command &copy; 2024
      </span>
    </div>

    <!-- Nav links -->
    <div class="flex gap-8">
      <a href="/privacy" class="text-outline hover:text-primary transition-colors font-label-caps text-[10px] uppercase">
        Privacy Protocol
      </a>
      <a href="/manual" class="text-outline hover:text-primary transition-colors font-label-caps text-[10px] uppercase">
        Manual
      </a>
      <a
        href="https://github.com"
        target="_blank"
        rel="noopener noreferrer"
        class="text-outline hover:text-primary transition-colors font-label-caps text-[10px] uppercase"
      >
        Source Code
      </a>
    </div>

    <!-- Build status -->
    <div class="flex items-center gap-4">
      <span class="font-data-sm text-[10px] text-primary">BUILD STATUS: STABLE</span>
      <div class="flex gap-1" aria-hidden="true">
        <div class="size-1 bg-primary"></div>
        <div class="size-1 bg-primary"></div>
        <div class="size-1 bg-primary"></div>
        <div class="size-1 bg-primary/20"></div>
      </div>
    </div>
  </div>
</footer>

<style>
  .landing-footer {
    position: relative;
    overflow: hidden;
    background:
      linear-gradient(180deg, #101213 0%, rgba(8, 9, 10, 0.98) 48%, #07090a 100%);
    border-top: 0;
  }

  .landing-footer::before {
    content: '';
    position: absolute;
    inset: 0 0 auto;
    height: 120px;
    pointer-events: none;
    background: linear-gradient(180deg, #101213, rgba(16, 18, 19, 0));
  }

  .footer-inner {
    position: relative;
    z-index: 1;
  }
</style>
