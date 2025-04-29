<script>
  export let vsm;
</script>

{#if vsm}
  <div class="mt-8">
    <!-- Best case metrics -->
    <h3 class="mb-2 text-lg font-semibold text-[var(--color-unicorn-white)]">Primary Flow</h3>
    <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
      <div
        class="rounded-md border border-[var(--color-light-gray)] bg-[var(--color-background-white)] p-4 text-center"
      >
        <h3 class="text-sm font-medium text-[var(--color-mission-blue)]">Lead Time</h3>
        <p class="mt-2 text-2xl font-bold text-[var(--color-defense-dark)]">
          {vsm.metrics.totalLeadTime}
        </p>
      </div>
      <div
        class="rounded-md border border-[var(--color-light-gray)] bg-[var(--color-background-white)] p-4 text-center"
      >
        <h3 class="text-sm font-medium text-[var(--color-mission-blue)]">Value-Added Time</h3>
        <p class="mt-2 text-2xl font-bold text-[var(--color-defense-dark)]">
          {vsm.metrics.totalValueAddedTime}
        </p>
      </div>
      <div
        class="rounded-md border border-[var(--color-light-gray)] bg-[var(--color-background-white)] p-4 text-center"
      >
        <h3 class="text-sm font-medium text-[var(--color-mission-blue)]">Value-Added Ratio</h3>
        <p class="mt-2 text-2xl font-bold text-[var(--color-defense-dark)]">
          {(vsm.metrics.valueAddedRatio * 100).toFixed(1)}%
        </p>
      </div>
    </div>

    <!-- Worst case metrics -->
    <h3 class="mb-2 text-lg font-semibold text-[var(--color-unicorn-white)]">Exception Flow</h3>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div
        class="rounded-md border border-[var(--color-action-red)] bg-[var(--color-unicorn-white)] p-4 text-center"
      >
        <h3 class="text-sm font-medium text-[var(--color-mission-blue)]">Exception Lead Time</h3>
        <p class="mt-2 text-2xl font-bold text-[var(--color-action-red)]">
          {vsm.metrics.worstCaseLeadTime || vsm.metrics.totalLeadTime}
        </p>
      </div>
      <div
        class="rounded-md border border-[var(--color-action-red)] bg-[var(--color-unicorn-white)] p-4 text-center"
      >
        <h3 class="text-sm font-medium text-[var(--color-mission-blue)]">Total Rework Time</h3>
        <p class="mt-2 text-2xl font-bold text-[var(--color-action-red)]">
          {vsm.metrics.totalReworkTime || 0}
        </p>
      </div>
      <div
        class="rounded-md border border-[var(--color-action-red)] bg-[var(--color-unicorn-white)] p-4 text-center"
      >
        <h3 class="text-sm font-medium text-[var(--color-mission-blue)]">Rework Impact</h3>
        <p class="mt-2 text-2xl font-bold text-[var(--color-action-red)]">
          {vsm.metrics.totalReworkTime
            ? `+${((vsm.metrics.totalReworkTime / vsm.metrics.totalLeadTime) * 100).toFixed(1)}%`
            : '0%'}
        </p>
      </div>
    </div>
  </div>
{/if}