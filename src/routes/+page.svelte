<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import { processBlock, connection, createVSM, renderVSM } from '$lib/valueStream';

  let container;
  let vsm;

  // Create sample VSM data
  function createSampleVSM() {
    // Create process blocks
    const process1 = processBlock.create({
      id: 'process1',
      name: 'Customer Request',
      position: { x: 50, y: 100 },
      metrics: { processTime: 10, waitTime: 5 }
    });

    const process2 = processBlock.create({
      id: 'process2',
      name: 'Analysis',
      position: { x: 250, y: 100 },
      metrics: { processTime: 30, waitTime: 15 }
    });

    const process3 = processBlock.create({
      id: 'process3',
      name: 'Development',
      position: { x: 450, y: 100 },
      metrics: { processTime: 60, waitTime: 20 }
    });

    const process4 = processBlock.create({
      id: 'process4',
      name: 'Testing',
      position: { x: 650, y: 100 },
      metrics: { processTime: 40, waitTime: 10 }
    });

    const process5 = processBlock.create({
      id: 'process5',
      name: 'Deployment',
      position: { x: 850, y: 100 },
      metrics: { processTime: 20, waitTime: 5 }
    });

    // Create connections between processes
    const conn1 = connection.create({
      id: 'conn1',
      sourceId: 'process1',
      targetId: 'process2',
      metrics: { transferTime: 2, batchSize: 1 }
    });

    const conn2 = connection.create({
      id: 'conn2',
      sourceId: 'process2',
      targetId: 'process3',
      metrics: { transferTime: 3, batchSize: 1 }
    });

    const conn3 = connection.create({
      id: 'conn3',
      sourceId: 'process3',
      targetId: 'process4',
      metrics: { transferTime: 2, batchSize: 1 }
    });

    const conn4 = connection.create({
      id: 'conn4',
      sourceId: 'process4',
      targetId: 'process5',
      metrics: { transferTime: 1, batchSize: 1 }
    });

    // Create the VSM with processes and connections
    return createVSM.create({
      id: 'vsm1',
      title: 'Software Development Value Stream',
      processes: [process1, process2, process3, process4, process5],
      connections: [conn1, conn2, conn3, conn4]
    });
  }

  // Process block click handler
  function handleProcessClick(process) {
    console.log('Process clicked:', process);
    // In a real implementation, this would show an edit dialog
    alert(`Process: ${process.name}\nProcess Time: ${process.metrics.processTime}\nWait Time: ${process.metrics.waitTime}`);
  }

  onMount(() => {
    vsm = createSampleVSM();
    
    // Render the VSM using D3
    renderVSM.render({
      container,
      vsm,
      options: {
        width: 1000,
        height: 400,
        onBlockClick: handleProcessClick
      }
    });
    
    // Return cleanup function
    return () => {
      // Clean up D3 elements if needed
      d3.select(container).selectAll('*').remove();
    };
  });
</script>

<svelte:head>
  <title>Value Stream Map</title>
</svelte:head>

<main class="max-w-7xl mx-auto p-4">
  <h1 class="text-3xl text-gray-800 mb-4">Value Stream Map</h1>
  
  <div class="mb-8">
    <p class="text-gray-600">
      This is a sample value stream map for a software development process.
      Click on process blocks to see details.
    </p>
  </div>
  
  <div class="w-full border border-gray-200 rounded-md overflow-hidden mb-8">
    <div bind:this={container} class="w-full h-[400px]"></div>
  </div>
  
  {#if vsm}
    <div class="mt-8">
      <h2 class="text-2xl text-gray-700 mb-4">Value Stream Metrics</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-gray-50 p-4 rounded-md text-center">
          <h3 class="text-sm text-gray-500 font-medium">Total Lead Time</h3>
          <p class="text-2xl font-bold mt-2">{vsm.metrics.totalLeadTime}</p>
        </div>
        <div class="bg-gray-50 p-4 rounded-md text-center">
          <h3 class="text-sm text-gray-500 font-medium">Value-Added Time</h3>
          <p class="text-2xl font-bold mt-2">{vsm.metrics.totalValueAddedTime}</p>
        </div>
        <div class="bg-gray-50 p-4 rounded-md text-center">
          <h3 class="text-sm text-gray-500 font-medium">Value-Added Ratio</h3>
          <p class="text-2xl font-bold mt-2">{(vsm.metrics.valueAddedRatio * 100).toFixed(1)}%</p>
        </div>
      </div>
    </div>
  {/if}
</main>