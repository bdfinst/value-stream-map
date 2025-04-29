<script>
  export let zoomController = {};
</script>

<div class="mt-2 flex justify-end gap-2">
  <div class="flex items-center">
    <span class="mr-1 text-sm text-[var(--color-unicorn-white)]">Zoom:</span>
  </div>

  <div class="flex rounded-md border border-[var(--color-mission-blue-32)]">
    <button
      class="flex items-center border-r border-[var(--color-light-gray)] bg-[var(--color-background-white)] px-3 py-1.5 text-[var(--color-mission-blue)] hover:bg-[var(--color-light-gray)]"
      on:click={() => zoomController.zoomOut?.()}
      title="Zoom Out"
      aria-label="Zoom out"
    >
      <i class="fas fa-minus text-sm"></i>
    </button>

    <button
      class="flex items-center border-r border-[var(--color-light-gray)] bg-[var(--color-background-white)] px-4 py-1.5 text-[var(--color-mission-blue)] hover:bg-[var(--color-light-gray)]"
      on:click={() => zoomController.zoomFit?.()}
      title="Fit to Screen"
      aria-label="Fit diagram to screen"
    >
      <i class="fas fa-expand text-sm"></i>
    </button>

    <button
      class="flex items-center bg-[var(--color-background-white)] px-3 py-1.5 text-[var(--color-mission-blue)] hover:bg-[var(--color-light-gray)]"
      on:click={() => zoomController.zoomIn?.()}
      title="Zoom In"
      aria-label="Zoom in"
    >
      <i class="fas fa-plus text-sm"></i>
    </button>
  </div>
</div>