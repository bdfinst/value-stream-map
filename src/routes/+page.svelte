<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import { processBlock, connection, createVSM, renderVSM } from '$lib/valueStream';
  import { initVSMStore } from '$lib/valueStream/vsmStore.js';
  import Modal from '$lib/components/Modal.svelte';
  import ProcessEditor from '$lib/components/ProcessEditor.svelte';

  let container;
  let renderedSvg;
  let vsmStore;
  let storeValue;
  
  // Modal state
  let showProcessModal = false;
  let currentProcess = null;
  
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

  // Initialize the VSM store
  function initializeStore() {
    const initialVSM = createSampleVSM();
    vsmStore = initVSMStore(initialVSM);
    
    // Subscribe to store changes
    const unsubscribe = vsmStore.subscribe(value => {
      storeValue = value;
      
      // If the VSM container exists, re-render it with the updated data
      if (container && value.vsm) {
        renderVSMWithSelection(value.vsm, value.selection);
      }
    });
    
    return unsubscribe;
  }
  
  // Render the VSM with selection highlighting
  function renderVSMWithSelection(vsm, selection) {
    // Clean up existing SVG
    if (renderedSvg) {
      renderedSvg.remove();
    }
    
    // Render the VSM using D3
    renderedSvg = renderVSM.render({
      container,
      vsm,
      options: {
        width: 1000,
        height: 400,
        onBlockClick: handleProcessClick,
        onBlockDrag: handleProcessDrag
      }
    });
    
    // Highlight selected elements
    if (selection.selectedIds.length > 0) {
      selection.selectedIds.forEach(id => {
        // Find and highlight process blocks
        renderedSvg.selectAll('.process')
          .filter(d => d.id === id)
          .select('rect')
          .style('stroke', '#3b82f6')
          .style('stroke-width', '3px');
          
        // Find and highlight connections
        renderedSvg.selectAll('.connection')
          .filter(d => d.id === id)
          .select('path')
          .style('stroke', '#3b82f6')
          .style('stroke-width', '3px');
      });
    }
  }
  
  // Process drag handler
  function handleProcessDrag(updatedProcess) {
    // Update the process position in the store
    vsmStore.updateProcess(updatedProcess.id, {
      position: updatedProcess.position
    });
  }

  // Process block click handler
  function handleProcessClick(process, action) {
    console.log('Process clicked:', process, action);
    
    // Toggle selection
    vsmStore.toggleSelection(process.id);
    
    // Only show edit modal if edit button was clicked
    if (action === 'edit') {
      // Store current process for editing
      currentProcess = process;
      
      // Show edit modal
      showProcessModal = true;
    }
  }
  
  // Handle process update
  function handleProcessUpdate(updatedProcess) {
    // Check if this is a new process (not yet in the store)
    const isNewProcess = !storeValue.vsm.processes.some(p => p.id === updatedProcess.id);
    
    if (isNewProcess) {
      // Add new process to the store
      vsmStore.addProcess(updatedProcess);
    } else {
      // Update existing process
      vsmStore.updateProcess(updatedProcess.id, updatedProcess);
    }
    
    // Close the modal
    showProcessModal = false;
    currentProcess = null;
  }
  
  // Create a new process
  function createNewProcess() {
    const newId = `process${storeValue.vsm.processes.length + 1}_${Date.now()}`;
    const newProcess = processBlock.create({
      id: newId,
      name: 'New Process',
      position: { x: 150, y: 200 },
      metrics: { processTime: 0, waitTime: 0 }
    });
    
    // Don't add to the store yet, just show the edit dialog
    currentProcess = newProcess;
    showProcessModal = true;
  }
  
  // Remove selected process
  function removeSelectedProcess() {
    const selectedId = storeValue.selection.selectedIds[0];
    if (selectedId) {
      // Check if it's a process or connection
      const process = storeValue.vsm.processes.find(p => p.id === selectedId);
      if (process) {
        if (confirm(`Are you sure you want to remove process "${process.name}"?`)) {
          vsmStore.removeProcess(selectedId);
        }
      }
    }
  }
  
  // Cancel editing
  function cancelEditing() {
    showProcessModal = false;
    currentProcess = null;
  }

  onMount(() => {
    // Initialize store
    const unsubscribe = initializeStore();
    
    // Return cleanup function
    return () => {
      unsubscribe();
      
      // Clean up D3 elements if needed
      if (renderedSvg) {
        renderedSvg.remove();
      }
    };
  });
</script>

<svelte:head>
  <title>Value Stream Map</title>
</svelte:head>

<main class="max-w-7xl mx-auto p-4">
  <h1 class="text-3xl text-gray-800 mb-4">Value Stream Map</h1>
  
  <div class="mb-4">
    <p class="text-gray-600">
      This is a sample value stream map for a software development process.
      Click on process blocks to edit them.
    </p>
  </div>
  
  <div class="mb-4 flex space-x-2">
    <button 
      class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      on:click={createNewProcess}
    >
      Add Process
    </button>
    
    {#if storeValue && storeValue.selection.selectedIds.length > 0}
      <button 
        class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        on:click={removeSelectedProcess}
      >
        Remove Selected
      </button>
    {/if}
  </div>
  
  <div class="w-full border border-gray-200 rounded-md overflow-hidden mb-8">
    <div bind:this={container} class="w-full h-[400px]"></div>
  </div>
  
  {#if storeValue && storeValue.vsm}
    <div class="mt-8">
      <h2 class="text-2xl text-gray-700 mb-4">Value Stream Metrics</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-gray-50 p-4 rounded-md text-center">
          <h3 class="text-sm text-gray-500 font-medium">Total Lead Time</h3>
          <p class="text-2xl font-bold mt-2">{storeValue.vsm.metrics.totalLeadTime}</p>
        </div>
        <div class="bg-gray-50 p-4 rounded-md text-center">
          <h3 class="text-sm text-gray-500 font-medium">Value-Added Time</h3>
          <p class="text-2xl font-bold mt-2">{storeValue.vsm.metrics.totalValueAddedTime}</p>
        </div>
        <div class="bg-gray-50 p-4 rounded-md text-center">
          <h3 class="text-sm text-gray-500 font-medium">Value-Added Ratio</h3>
          <p class="text-2xl font-bold mt-2">{(storeValue.vsm.metrics.valueAddedRatio * 100).toFixed(1)}%</p>
        </div>
      </div>
    </div>
  {/if}
</main>

<Modal 
  show={showProcessModal} 
  title="Edit Process" 
  onClose={cancelEditing}
>
  {#if currentProcess}
    <ProcessEditor 
      process={currentProcess} 
      onSave={handleProcessUpdate} 
      onCancel={cancelEditing} 
    />
  {/if}
</Modal>