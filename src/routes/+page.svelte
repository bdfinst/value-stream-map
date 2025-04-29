<script>
	import ConnectionEditor from '$lib/components/ConnectionEditor.svelte';
	import MetricsDisplay from '$lib/components/MetricsDisplay.svelte';
	import MetricsLegend from '$lib/components/MetricsLegend.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import ProcessEditor from '$lib/components/ProcessEditor.svelte';
	import VSMContainer from '$lib/components/VSMContainer.svelte';
	import VSMToolbar from '$lib/components/VSMToolbar.svelte';
	import { connection, processBlock, renderVSM } from '$lib/valueStream';
	import { createSampleVSM } from '$lib/valueStream/sampleVSM.js';
	import { initVSMStore } from '$lib/valueStream/vsmStore.js';
	import { onMount } from 'svelte';

	let container;
	let renderedVSM;
	let vsmStore;
	let storeValue;
	let zoomController = {};

	// Modal state
	let showProcessModal = false;
	let showConnectionModal = false;
	let showLegendModal = false;
	let currentProcess = null;
	let currentConnection = null;

	// Initialize the VSM store
	function initializeStore() {
		const initialVSM = createSampleVSM();
		vsmStore = initVSMStore(initialVSM);

		// Subscribe to store changes
		const unsubscribe = vsmStore.subscribe((value) => {
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
			selection.selectedIds.forEach((id) => {
				// Find and highlight process blocks
				renderedVSM.svg
					.selectAll('.process')
					.filter((d) => d.id === id)
					.select('rect')
					.style('stroke', '#3b82f6')
					.style('stroke-width', '3px');

				// Find and highlight connections
				renderedVSM.svg
					.selectAll('.connection')
					.filter((d) => d.id === id)
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
		const isNewProcess = !storeValue.vsm.processes.some((p) => p.id === updatedProcess.id);

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
			const process = storeValue.vsm.processes.find((p) => p.id === selectedId);
			const conn = storeValue.vsm.connections.find((c) => c.id === selectedId);

			if (process) {
				if (confirm(`Are you sure you want to remove process "${process.name}"?`)) {
					vsmStore.removeProcess(selectedId);
				}
			} else if (conn) {
				// Get source and target names for better user feedback
				const source =
					storeValue.vsm.processes.find((p) => p.id === conn.sourceId)?.name || 'Unknown';
				const target =
					storeValue.vsm.processes.find((p) => p.id === conn.targetId)?.name || 'Unknown';

				if (
					confirm(`Are you sure you want to remove the connection from "${source}" to "${target}"?`)
				) {
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
		const isNewConnection = !storeValue.vsm.connections.some((c) => c.id === updatedConnection.id);

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

	// Toggle legend modal
	function toggleLegend() {
		showLegendModal = !showLegendModal;
	}

	// Bind container element
	function bindContainer(el) {
		container = el;
	}

	onMount(() => {
		// Initialize store
		const unsubscribe = initializeStore();

		// Return cleanup function
		return () => {
			unsubscribe();

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

<main class="mx-auto my-4 max-w-7xl rounded-lg bg-[var(--color-hero-navy)] p-4 shadow-xl">
	<div class="mb-4 flex items-center justify-between rounded-md bg-[var(--color-hero-navy)] p-4">
		<div class="flex-grow text-center">
			<h1 class="text-3xl text-[var(--color-unicorn-white)]">Value Stream Map</h1>
		</div>

		<!-- Help button in header -->
		<button
			class="p-2 text-[var(--color-unicorn-white)] transition-colors hover:text-[var(--color-unicorn-white-50)]"
			title="Metrics Help"
			aria-label="View metrics help guide"
			on:click={toggleLegend}
		>
			<i class="fas fa-question-circle text-xl"></i>
		</button>
	</div>

	<!-- Toolbar Component -->
	<VSMToolbar
		selection={storeValue?.selection}
		onCreateProcess={createNewProcess}
		onCreateConnection={createNewConnection}
		onRemoveSelected={removeSelectedItem}
	/>

	<!-- VSM Container Component -->
	<VSMContainer {zoomController} {bindContainer} {storeValue} {renderVSMWithSelection} />

	<!-- Metrics Display Component -->
	{#if storeValue && storeValue.vsm}
		<MetricsDisplay vsm={storeValue.vsm} />
	{/if}
</main>

<!-- Modals -->
<Modal show={showProcessModal} title="Edit Process" onClose={cancelEditing}>
	{#if currentProcess}
		<ProcessEditor process={currentProcess} onSave={handleProcessUpdate} onCancel={cancelEditing} />
	{/if}
</Modal>

<Modal show={showConnectionModal} title="Edit Connection" onClose={cancelEditing}>
	{#if currentConnection && storeValue}
		<ConnectionEditor
			connection={currentConnection}
			processes={storeValue.vsm.processes}
			onSave={handleConnectionUpdate}
			onCancel={cancelEditing}
		/>
	{/if}
</Modal>

<!-- Metrics Legend Modal -->
<Modal show={showLegendModal} title="Value Stream Metrics Guide" onClose={toggleLegend}>
	<div class="p-2">
		<MetricsLegend />
	</div>
</Modal>
