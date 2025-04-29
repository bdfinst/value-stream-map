<script>
  import MetricCard from './MetricCard.svelte';
  export let vsm;
</script>

{#if vsm}
  <div class="mt-8">
    <!-- Primary Flow metrics -->
    <h3 class="mb-2 text-lg font-semibold text-[var(--color-unicorn-white)]">Primary Flow</h3>
    <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
      <MetricCard 
        title="Lead Time" 
        value={vsm.metrics.totalLeadTime} 
        isException={false} 
      />
      <MetricCard 
        title="Value-Added Time" 
        value={vsm.metrics.totalValueAddedTime} 
        isException={false} 
      />
      <MetricCard 
        title="Value-Added Ratio" 
        value={`${(vsm.metrics.valueAddedRatio * 100).toFixed(1)}%`} 
        isException={false} 
      />
    </div>

    <!-- Exception Flow metrics -->
    <h3 class="mb-2 text-lg font-semibold text-[var(--color-unicorn-white)]">Exception Flow</h3>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <MetricCard 
        title="Exception Lead Time" 
        value={vsm.metrics.worstCaseLeadTime || vsm.metrics.totalLeadTime} 
        isException={true} 
      />
      <MetricCard 
        title="Total Rework Time" 
        value={vsm.metrics.totalReworkTime || 0} 
        isException={true} 
      />
      <MetricCard 
        title="Rework Impact" 
        value={vsm.metrics.totalReworkTime
          ? `+${((vsm.metrics.totalReworkTime / vsm.metrics.totalLeadTime) * 100).toFixed(1)}%`
          : '0%'} 
        isException={true} 
      />
    </div>
  </div>
{/if}