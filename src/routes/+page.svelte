<script>
	import ConnectionEditor from '$lib/components/ConnectionEditor.svelte';
	import MetricsDisplay from '$lib/components/MetricsDisplay.svelte';
	import MetricsLegend from '$lib/components/MetricsLegend.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import ProcessEditor from '$lib/components/ProcessEditor.svelte';
	import VSMContainer from '$lib/components/VSMContainer.svelte';
	import VSMToolbar from '$lib/components/VSMToolbar.svelte';
	import { connection, processBlock, renderVSM } from '$lib/valueStream';
	import processCreationFlow from '$lib/valueStream/processCreationFlow.js';
	// Connection modal enhancer is included via processCreationFlow
	import { createSampleVSM } from '$lib/valueStream/sampleVSM.js';
	import { initVSMStore } from '$lib/valueStream/vsmStore.js';
	import vsmCreator from '$lib/valueStream/createVSM.js';
	import * as filePersistence from '$lib/valueStream/filePersistence.js';
	import { onMount } from 'svelte';

	let container;
	let renderedVSM;
	let vsmStore;
	let storeValue;
	let zoomController = {};

	// File persistence state
	let hasUnsavedChanges = false;
	let autoSaveTimer = null;
	let lastSavedVSM = null;

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

		// Determine if this is the last process (no outgoing normal connections)
		const isLastProcess = !storeValue.vsm.connections.some(
			(conn) => conn.sourceId === process.id && !conn.isRework
		);

		// Store current process for editing along with last process flag
		currentProcess = { ...process, isLastProcess };

		// Show edit modal
		showProcessModal = true;
	}

	// Handle process update
	function handleProcessUpdate(updatedProcess) {
		// Check if this is a new process (not yet in the store)
		const isNewProcess = !storeValue.vsm.processes.some((p) => p.id === updatedProcess.id);

		// Remove the isLastProcess flag as it's not part of the actual process model
		// eslint-disable-next-line no-unused-vars
		const { isLastProcess, ...processToSave } = updatedProcess;

		if (isNewProcess) {
			// Add new process to the store
			vsmStore.addProcess(processToSave);

			// After adding a new process, prompt for connection creation
			// but only if there were already other processes
			if (storeValue.vsm.processes.length > 1) {
				// Use the processCreationFlow to handle the connection prompting
				// providing the necessary callbacks
				processCreationFlow.promptConnectionAfterProcessCreation(vsmStore, processToSave, {
					showConnectionModal: (show) => (showConnectionModal = show),
					setCurrentConnection: (conn) => (currentConnection = conn),
					setCurrentProcess: (proc) => (currentProcess = proc)
				});
			}
		} else {
			// Update existing process
			vsmStore.updateProcess(processToSave.id, processToSave);
		}

		// Close the process edit modal
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
	function createNewConnection(newProcessId = null) {
		const newId = `conn${storeValue.vsm.connections.length + 1}_${Date.now()}`;

		// Create the initial connection with minimal data
		let newConnection = connection.create({
			id: newId,
			sourceId: '',
			targetId: newProcessId || '', // Set target if providing a new process ID
			metrics: { waitTime: 0 }
		});

		// Don't add to the store yet, just show the edit dialog
		// The ConnectionEditor component will handle pre-filling values
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

	// Auto-arrange the VSM processes
	function autoArrangeVSM() {
		if (!storeValue || !storeValue.vsm) return;

		// Use the autoArrange function to rearrange processes
		const updatedVSM = vsmCreator.autoArrange(storeValue.vsm);

		// Update the store with the new VSM
		vsmStore.setVSM(updatedVSM);

		// After arranging, zoom to fit to show all processes
		setTimeout(() => {
			if (zoomController && zoomController.zoomFit) {
				zoomController.zoomFit();
			}
		}, 100);
	}

	// File operations
	async function handleSave() {
		try {
			if (!storeValue || !storeValue.vsm) return;

			await filePersistence.saveVSM(storeValue.vsm);
			updateSavedState(storeValue.vsm);
		} catch (error) {
			console.error('Error saving VSM:', error);
			alert(`Failed to save: ${error.message}`);
		}
	}

	async function handleSaveAs() {
		try {
			if (!storeValue || !storeValue.vsm) return;

			const filename = prompt(
				'Enter a name for your file:',
				storeValue.vsm.title || 'value-stream-map'
			);
			if (!filename) return;

			await filePersistence.saveVSMAs(storeValue.vsm, filename);
			updateSavedState(storeValue.vsm);
		} catch (error) {
			console.error('Error saving VSM as:', error);
			alert(`Failed to save: ${error.message}`);
		}
	}

	async function handleLoad() {
		try {
			const loadedVSM = await filePersistence.loadVSM();
			if (loadedVSM) {
				// Reinitialize the store with the loaded VSM
				vsmStore = initVSMStore(loadedVSM);
				updateSavedState(loadedVSM);

				// After loading, zoom to fit to show all processes
				setTimeout(() => {
					if (zoomController && zoomController.zoomFit) {
						zoomController.zoomFit();
					}
				}, 100);
			}
		} catch (error) {
			console.error('Error loading VSM:', error);
			alert(`Failed to load: ${error.message}`);
		}
	}

	function handleNewVSM() {
		// Create a blank new VSM
		const initialVSM = vsmCreator.create({
			id: `vsm_${Date.now()}`,
			title: 'Untitled Value Stream Map',
			processes: [],
			connections: []
		});

		// Reinitialize the store with the new VSM
		vsmStore = initVSMStore(initialVSM);
		updateSavedState(initialVSM);
	}

	async function handleLoadRecent(fileInfo) {
		try {
			// For now, just show a message that we would load the file
			alert(`This would load the recent file: ${fileInfo.title}`);

			// In a real implementation, you'd either:
			// 1. Store the full VSM in the recent files list and load directly
			// 2. Store a file reference and load it using File System Access API
		} catch (error) {
			console.error('Error loading recent VSM:', error);
			alert(`Failed to load recent file: ${error.message}`);
		}
	}

	// Auto-save functionality
	function startAutoSave() {
		if (autoSaveTimer) return;

		// Set up auto-save timer (5 seconds)
		autoSaveTimer = setInterval(async () => {
			const autoSaveStatus = filePersistence.getAutoSaveStatus();

			// Only auto-save if enabled and we have unsaved changes
			if (autoSaveStatus.isEnabled && hasUnsavedChanges && storeValue && storeValue.vsm) {
				try {
					const success = await filePersistence.autoSaveVSM(storeValue.vsm);
					if (success) {
						updateSavedState(storeValue.vsm);
					}
				} catch (error) {
					console.error('Auto-save failed:', error);
				}
			}
		}, 5000);
	}

	// Update saved state
	function updateSavedState(vsm) {
		lastSavedVSM = JSON.parse(JSON.stringify(vsm));
		hasUnsavedChanges = false;
	}

	// Check for unsaved changes
	function checkUnsavedChanges() {
		if (!lastSavedVSM || !storeValue || !storeValue.vsm) {
			// If no save state, mark as unsaved if we have any processes
			hasUnsavedChanges = storeValue?.vsm?.processes?.length > 0;
			return;
		}

		hasUnsavedChanges = filePersistence.hasUnsavedChanges(storeValue.vsm);
	}

	// Bind container element
	function bindContainer(el) {
		container = el;
	}

	// Handle beforeunload event to warn about unsaved changes
	function handleBeforeUnload(event) {
		if (hasUnsavedChanges) {
			event.preventDefault();
			event.returnValue = '';
		}
	}

	onMount(() => {
		// Initialize store
		const unsubscribe = initializeStore();

		// Initialize file persistence
		filePersistence.initialize();

		// Start auto-save
		startAutoSave();

		// Set up store subscription for change detection
		const storeSubscription = vsmStore.subscribe((value) => {
			if (value && value.vsm) {
				// Check for unsaved changes
				checkUnsavedChanges();
			}
		});

		// Set up beforeunload event listener
		window.addEventListener('beforeunload', handleBeforeUnload);

		// Return cleanup function
		return () => {
			unsubscribe();
			storeSubscription();

			// Clean up auto-save timer
			if (autoSaveTimer) {
				clearInterval(autoSaveTimer);
			}

			// Remove event listener
			window.removeEventListener('beforeunload', handleBeforeUnload);

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
		onAutoArrange={autoArrangeVSM}
		onSave={handleSave}
		onSaveAs={handleSaveAs}
		onLoad={handleLoad}
		onNewVSM={handleNewVSM}
		onLoadRecent={handleLoadRecent}
		{hasUnsavedChanges}
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
		<ProcessEditor
			process={currentProcess}
			isLastProcess={currentProcess.isLastProcess}
			onSave={handleProcessUpdate}
			onCancel={cancelEditing}
		/>
	{/if}
</Modal>

<Modal show={showConnectionModal} title="Edit Connection" onClose={cancelEditing}>
	{#if currentConnection && storeValue}
		<ConnectionEditor
			connection={currentConnection}
			processes={storeValue.vsm.processes}
			connections={storeValue.vsm.connections}
			onSave={handleConnectionUpdate}
			onCancel={cancelEditing}
			newProcessId={currentConnection.targetId || null}
		/>
	{/if}
</Modal>

<!-- Metrics Legend Modal -->
<Modal show={showLegendModal} title="Value Stream Metrics Guide" onClose={toggleLegend}>
	<div class="p-2">
		<MetricsLegend />
	</div>
</Modal>
