<script>
  /**
   * Component that displays a legend with tooltips for metrics
   */
  
  // List of all metrics with their explanations
  const metrics = [
    {
      id: "pt",
      label: "PT",
      name: "Process Time",
      color: "#2d3748",
      description: "The time it takes to process a single unit of work. This is the actual value-adding time."
    },
    {
      id: "wt",
      label: "WT",
      name: "Wait Time",
      color: "#4a5568",
      description: "The time a unit spends waiting between processes. Shown on connections between processes."
    },
    {
      id: "ct",
      label: "CT",
      name: "Cycle Time",
      color: "#2b6cb0",
      description: "The total time for a process, including both process time and incoming wait time."
    },
    {
      id: "rt",
      label: "RT",
      name: "Rework Time",
      color: "#e53e3e",
      description: "Additional time spent when work needs to be redone due to quality issues or feedback loops."
    },
    {
      id: "ca",
      label: "%C/A",
      name: "Complete & Accurate",
      color: "#38a169",
      description: "Percentage of work that is done correctly the first time and doesn't require rework."
    }
  ];
  
  // Value stream level metrics
  const vsmMetrics = [
    {
      id: "leadTime",
      name: "Lead Time",
      description: "The total time from start to finish of the entire value stream (best case)."
    },
    {
      id: "valueAddedTime",
      name: "Value-Added Time",
      description: "The sum of all process times, representing work that actually transforms the product."
    },
    {
      id: "valueAddedRatio",
      name: "Value-Added Ratio",
      description: "The percentage of total lead time that actually adds value (Value-Added Time ÷ Lead Time)."
    },
    {
      id: "worstCase",
      name: "Worst Case Lead Time",
      description: "The total lead time when accounting for all possible rework loops and quality issues."
    },
    {
      id: "reworkTime",
      name: "Total Rework Time",
      description: "The additional time spent on rework across the entire value stream."
    },
    {
      id: "reworkImpact",
      name: "Rework Impact",
      description: "The percentage increase in lead time due to rework (Total Rework Time ÷ Lead Time)."
    }
  ];
  
  // Controls whether tooltips are shown on hover or click (for mobile)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
</script>

<div class="metrics-legend bg-white p-5 rounded-md max-w-3xl mx-auto">
  <div class="mb-5">
    <p class="text-sm text-gray-600 mb-2">
      This guide explains all the metrics and visual elements used in the Value Stream Map. Hover over any item for a detailed description.
    </p>
  </div>
  
  <div class="grid sm:grid-cols-2 gap-6">
    <div class="bg-gray-50 p-4 rounded-md">
      <h4 class="text-sm font-medium text-gray-700 mb-3">Process & Connection Metrics</h4>
      <ul class="space-y-3">
        {#each metrics as metric}
          <li class="flex items-center group relative border-b border-gray-100 pb-2">
            <span class="inline-block w-8 text-center font-bold" style="color: {metric.color};">
              {metric.label}
            </span>
            <span class="text-sm text-gray-700">{metric.name}</span>
            
            <!-- Info icon with tooltip -->
            <div class="relative ml-auto inline-block">
              <button class="text-gray-400 hover:text-gray-600 focus:outline-none" aria-label={`Information about ${metric.name}`}>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
              </button>
              
              <!-- Tooltip -->
              <div class="absolute z-10 w-60 px-3 py-2 text-sm text-left text-white bg-gray-700 rounded-md shadow-lg
                          opacity-0 invisible group-hover:opacity-100 group-hover:visible
                          transition-opacity duration-300 -translate-x-3/4 left-0 bottom-full mb-1">
                {metric.description}
                <div class="absolute w-2 h-2 bg-gray-700 transform rotate-45 left-3/4 -translate-x-1/2 -bottom-1"></div>
              </div>
            </div>
          </li>
        {/each}
      </ul>
    </div>
    
    <div class="bg-gray-50 p-4 rounded-md">
      <h4 class="text-sm font-medium text-gray-700 mb-3">Value Stream Metrics</h4>
      <ul class="space-y-3">
        {#each vsmMetrics as metric}
          <li class="flex items-center group relative border-b border-gray-100 pb-2">
            <span class="text-sm text-gray-700">{metric.name}</span>
            
            <!-- Info icon with tooltip -->
            <div class="relative ml-auto inline-block">
              <button class="text-gray-400 hover:text-gray-600 focus:outline-none" aria-label={`Information about ${metric.name}`}>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
              </button>
              
              <!-- Tooltip -->
              <div class="absolute z-10 w-60 px-3 py-2 text-sm text-left text-white bg-gray-700 rounded-md shadow-lg
                          opacity-0 invisible group-hover:opacity-100 group-hover:visible
                          transition-opacity duration-300 -translate-x-3/4 left-0 bottom-full mb-1">
                {metric.description}
                <div class="absolute w-2 h-2 bg-gray-700 transform rotate-45 left-3/4 -translate-x-1/2 -bottom-1"></div>
              </div>
            </div>
          </li>
        {/each}
      </ul>
    </div>
  </div>
  
  <div class="mt-6 bg-gray-50 p-4 rounded-md">
    <h4 class="text-sm font-medium text-gray-700 mb-3">Visual Elements</h4>
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
      <div class="flex items-center group relative">
        <div class="w-8 h-2 bg-gray-500 rounded-sm mr-2"></div>
        <span class="text-sm text-gray-700">Normal Flow</span>
      </div>
      <div class="flex items-center group relative">
        <div class="w-8 h-2 bg-red-500 rounded-sm mr-2"></div>
        <span class="text-sm text-gray-700">Rework Flow</span>
      </div>
      <div class="flex items-center group relative">
        <div class="w-5 h-5 rounded-sm mr-2 border border-red-500 flex items-center justify-center text-xs text-red-500 font-bold">R</div>
        <span class="text-sm text-gray-700">Rework Time</span>
      </div>
      <div class="flex items-center group relative">
        <div class="w-6 h-6 rounded-full bg-gray-50 border border-gray-300 text-gray-500 flex items-center justify-center mr-2 text-xs">WT</div>
        <span class="text-sm text-gray-700">Wait Time Label</span>
      </div>
      <div class="flex items-center group relative">
        <div class="w-6 h-6 bg-gray-50 text-green-600 flex items-center justify-center mr-2 text-xs rounded-sm border border-gray-300">98%</div>
        <span class="text-sm text-gray-700">C/A Percentage</span>
      </div>
    </div>
  </div>
</div>