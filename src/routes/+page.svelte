<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import { processBlock, connection, createVSM, renderVSM } from '$lib/valueStream';
  import { initVSMStore } from '$lib/valueStream/vsmStore.js';
  import Modal from '$lib/components/Modal.svelte';
  import ProcessEditor from '$lib/components/ProcessEditor.svelte';
  import ConnectionEditor from '$lib/components/ConnectionEditor.svelte';

  let container;
  let renderedVSM;
  let vsmStore;
  let storeValue;
  let zoomController = {};
  
  // Modal state
  let showProcessModal = false;
  let showConnectionModal = false;
  let currentProcess = null;
  let currentConnection = null;
  
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
      targetId: 'process2'
    });

    const conn2 = connection.create({
      id: 'conn2',
      sourceId: 'process2',
      targetId: 'process3'
    });

    const conn3 = connection.create({
      id: 'conn3',
      sourceId: 'process3',
      targetId: 'process4'
    });

    const conn4 = connection.create({
      id: 'conn4',
      sourceId: 'process4',
      targetId: 'process5'
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
    // Render the VSM using D3
    renderedVSM = renderVSM.render({
      container,
      vsm,
      options: {
        width: 1000,
        height: 400,
        onBlockClick: handleProcessSelection,
        onBlockEdit: handleProcessEdit,
        onBlockDrag: handleProcessDrag,
        onConnectionClick: handleConnectionSelection,
        onConnectionEdit: handleConnectionEdit,
        onConnectionDrag: handleConnectionDrag
      }
    });
    
    // Store zoom controller functions
    zoomController = {
      zoomFit: renderedVSM.zoomFit,
      zoomIn: renderedVSM.zoomIn,
      zoomOut: renderedVSM.zoomOut
    };
    
    // Highlight selected elements
    if (selection.selectedIds.length > 0) {
      selection.selectedIds.forEach(id => {
        // Find and highlight process blocks
        renderedVSM.svg.selectAll('.process')
          .filter(d => d.id === id)
          .select('rect')
          .style('stroke', '#3b82f6')
          .style('stroke-width', '3px');
          
        // Find and highlight connections
        renderedVSM.svg.selectAll('.connection')
          .filter(d => d.id === id)
          .select('path')
          .style('stroke', '#3b82f6')
          .style('stroke-width', '3px');
      });
    }
  }
  
  // Process drag handler
  function handleProcessDrag(updatedProcess) {
    console.log('Process dragged:', updatedProcess);
    
    // Update the entire process in the store to ensure position is updated correctly
    vsmStore.updateProcess(updatedProcess.id, updatedProcess);
    
    // When the store updates, the rendering will be triggered automatically
    // and connections will be redrawn correctly through renderVSMWithSelection
  }

  // Process selection handler
  function handleProcessSelection(process) {
    console.log('Process selected:', process);
    
    // Toggle selection
    vsmStore.toggleSelection(process.id);
  }
  
  // Process edit handler 
  function handleProcessEdit(process) {
    console.log('Process edit:', process);
    
    // Store current process for editing
    currentProcess = process;
    
    // Show edit modal
    showProcessModal = true;
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
  
  // Remove selected item
  function removeSelectedItem() {
    const selectedId = storeValue.selection.selectedIds[0];
    if (selectedId) {
      // Check if it's a process or connection
      const process = storeValue.vsm.processes.find(p => p.id === selectedId);
      const conn = storeValue.vsm.connections.find(c => c.id === selectedId);
      
      if (process) {
        if (confirm(`Are you sure you want to remove process "${process.name}"?`)) {
          vsmStore.removeProcess(selectedId);
        }
      } else if (conn) {
        // Get source and target names for better user feedback
        const source = storeValue.vsm.processes.find(p => p.id === conn.sourceId)?.name || 'Unknown';
        const target = storeValue.vsm.processes.find(p => p.id === conn.targetId)?.name || 'Unknown';
        
        if (confirm(`Are you sure you want to remove the connection from "${source}" to "${target}"?`)) {
          vsmStore.removeConnection(selectedId);
        }
      }
    }
  }
  
  // Handle connection drag
  function handleConnectionDrag(updatedConnection) {
    console.log('Connection dragged:', updatedConnection);
    
    // Update the connection in the store
    vsmStore.updateConnection(updatedConnection.id, updatedConnection);
  }
  
  // Connection selection handler
  function handleConnectionSelection(connection) {
    console.log('Connection selected:', connection);
    
    // Toggle selection
    vsmStore.toggleSelection(connection.id);
  }
  
  // Connection edit handler
  function handleConnectionEdit(connection) {
    console.log('Connection edit:', connection);
    
    // Store current connection for editing
    currentConnection = connection;
    
    // Show edit modal
    showConnectionModal = true;
  }
  
  // Handle connection update
  function handleConnectionUpdate(updatedConnection) {
    // Check if this is a new connection (not yet in the store)
    const isNewConnection = !storeValue.vsm.connections.some(c => c.id === updatedConnection.id);
    
    if (isNewConnection) {
      // Add new connection to the store
      vsmStore.addConnection(updatedConnection);
    } else {
      // Update existing connection
      vsmStore.updateConnection(updatedConnection.id, updatedConnection);
    }
    
    // Close the modal
    showConnectionModal = false;
    currentConnection = null;
  }
  
  // Create a new connection
  function createNewConnection() {
    const newId = `conn${storeValue.vsm.connections.length + 1}_${Date.now()}`;
    const newConnection = connection.create({
      id: newId,
      sourceId: '',
      targetId: ''
    });
    
    // Don't add to the store yet, just show the edit dialog
    currentConnection = newConnection;
    showConnectionModal = true;
  }
  
  // Cancel editing
  function cancelEditing() {
    showProcessModal = false;
    showConnectionModal = false;
    currentProcess = null;
    currentConnection = null;
  }

  onMount(() => {
    // Initialize store
    const unsubscribe = initializeStore();
    
    // Create a ResizeObserver to handle container resizing
    const resizeObserver = new ResizeObserver(() => {
      if (container && storeValue?.vsm) {
        // Re-render on resize
        renderVSMWithSelection(storeValue.vsm, storeValue.selection);
      }
    });
    
    // Start observing the container
    if (container) {
      resizeObserver.observe(container);
    }
    
    // Return cleanup function
    return () => {
      unsubscribe();
      
      // Stop observing resize events
      resizeObserver.disconnect();
      
      // Clean up D3 elements if needed
      if (renderedVSM && renderedVSM.svg) {
        renderedVSM.svg.remove();
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
      class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
      on:click={createNewProcess}
    >
      <i class="fas fa-cube"></i>
      Add Process
    </button>
    
    <button 
      class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
      on:click={createNewConnection}
    >
      <i class="fas fa-link"></i>
      Add Connection
    </button>
    
    {#if storeValue && storeValue.selection.selectedIds.length > 0}
      <button 
        class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
        on:click={removeSelectedItem}
      >
        <i class="fas fa-trash-alt"></i>
        Remove Selected
      </button>
    {/if}
  </div>
  
  <div class="mb-8">
    <div class="w-full border border-gray-200 rounded-md overflow-hidden"
         style="resize: both; min-height: 400px;">
      <div bind:this={container} class="w-full h-full" style="min-height: 400px;"></div>
    </div>
    
    <!-- External zoom controls -->
    <div class="flex justify-end mt-2 gap-1">
      <div class="flex items-center mr-2">
        <span class="text-sm text-gray-500 mr-1">Zoom:</span>
      </div>
      
      <div class="border border-gray-300 rounded-md flex">
        <button 
          class="px-3 py-1.5 bg-white text-gray-700 hover:bg-gray-100 flex items-center border-r border-gray-300"
          on:click={() => zoomController.zoomOut?.()}
          title="Zoom Out"
        >
          <i class="fas fa-minus text-sm"></i>
        </button>
        
        <button 
          class="px-4 py-1.5 bg-white text-gray-700 hover:bg-gray-100 flex items-center border-r border-gray-300"
          on:click={() => zoomController.zoomFit?.()}
          title="Fit to Screen"
        >
          <i class="fas fa-expand text-sm"></i>
        </button>
        
        <button 
          class="px-3 py-1.5 bg-white text-gray-700 hover:bg-gray-100 flex items-center"
          on:click={() => zoomController.zoomIn?.()}
          title="Zoom In"
        >
          <i class="fas fa-plus text-sm"></i>
        </button>
      </div>
    </div>
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

<Modal
  show={showConnectionModal}
  title="Edit Connection"
  onClose={cancelEditing}
>
  {#if currentConnection && storeValue}
    <ConnectionEditor
      connection={currentConnection}
      processes={storeValue.vsm.processes}
      onSave={handleConnectionUpdate}
      onCancel={cancelEditing}
    />
  {/if}
</Modal>