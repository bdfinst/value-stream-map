<script>
	import { validateConnection } from '../valueStream/connectionEditor.js';
	import connectionModalEnhancer from '../valueStream/connectionModalEnhancer.js';

	/** @type {import('../valueStream/connection').Connection} */
	export let connection;
	/** @type {Array} - List of all processes for selection */
	export let processes = [];
	/** @type {Function} */
	export let onSave;
	/** @type {Function} */
	export let onCancel;
	/** @type {String} - ID of a newly created process that should be pre-selected */
	export let newProcessId = null;
	/** @type {Array} - List of all connections in the VSM */
	export let connections = [];

	/**
	 * Prepares the connection for editing, applying any pre-fill logic needed
	 * @param {Object} originalConnection - The original connection
	 * @returns {Object} - The prepared connection
	 */
	function prepareConnectionForEditing(originalConnection) {
		// No pre-filling needed if no new process ID
		if (!newProcessId || !processes.some((p) => p.id === newProcessId)) {
			return originalConnection;
		}

		// Pre-fill the connection based on the new process ID
		// Use the connection enhancer to suggest appropriate values
		return connectionModalEnhancer.preSelectConnectionValues(
			originalConnection,
			processes,
			connections,
			newProcessId
		);
	}

	// Prepare connection data for editing
	const preFilledConnection = prepareConnectionForEditing(connection);

	// Create local copies of connection data for editing
	let sourceId = preFilledConnection.sourceId;
	let targetId = preFilledConnection.targetId;
	let waitTime = preFilledConnection.metrics?.waitTime || 0;
	let isRework = preFilledConnection.isRework || false;

	// Form validation
	let errors = {};

	/**
	 * Validates the connection form data
	 * @returns {boolean} - Whether the form is valid
	 */
	function validateForm() {
		const connectionData = {
			sourceId,
			targetId,
			metrics: { waitTime }
		};

		// Convert waitTime to number
		waitTime = Number(waitTime);
		if (isNaN(waitTime) || waitTime < 0) {
			errors = { ...errors, 'metrics.waitTime': 'Wait time must be a positive number' };
			return false;
		}

		const result = validateConnection(connectionData);
		errors = result.errors;

		return result.isValid;
	}

	/**
	 * Handles the form submission
	 */
	function handleSubmit() {
		if (!validateForm()) return;

		// Create updated connection object
		const updatedConnection = {
			...connection,
			sourceId,
			targetId,
			isRework,
			metrics: {
				...(connection.metrics || {}),
				waitTime: Number(waitTime)
			}
		};

		onSave(updatedConnection);
	}

	/**
	 * Determines if this is for creating a new connection
	 * @returns {boolean} - True if creating a new connection
	 */
	function isNewConnection() {
		return !connection.sourceId && !connection.targetId;
	}
</script>

<div class="rounded-lg bg-white p-4 shadow">
	<h2 class="mb-4 text-xl font-bold">Edit Connection</h2>

	<!-- Guidance message when adding new connection -->
	{#if isNewConnection()}
		<div class="mb-4 rounded-md bg-blue-50 p-3 text-blue-800">
			<div class="flex">
				<div class="flex-shrink-0">
					<i class="fas fa-info-circle"></i>
				</div>
				<div class="ml-3">
					<p class="text-sm font-medium">
						Connections define the flow between processes. Select a source and target process to
						create a connection.
					</p>
				</div>
			</div>
		</div>
	{/if}

	<form on:submit|preventDefault={handleSubmit} class="space-y-4">
		<div>
			<label
				for="source-process"
				class="mb-1 block text-sm font-medium text-[var(--color-defense-dark)]"
				>Source Process</label
			>
			<select
				id="source-process"
				bind:value={sourceId}
				class="w-full rounded-md border border-[var(--color-light-gray)] px-3 py-2 shadow-sm focus:border-[var(--color-mission-blue)] focus:ring-[var(--color-mission-blue)] focus:outline-none"
			>
				<option value="">Select a source process</option>
				{#each processes as process}
					<option value={process.id}>{process.name}</option>
				{/each}
			</select>
			{#if errors.sourceId}
				<p class="mt-1 text-sm text-red-600">{errors.sourceId}</p>
			{/if}
		</div>

		<div>
			<label
				for="target-process"
				class="mb-1 block text-sm font-medium text-[var(--color-defense-dark)]"
				>Target Process</label
			>
			<select
				id="target-process"
				bind:value={targetId}
				class="w-full rounded-md border border-[var(--color-light-gray)] px-3 py-2 shadow-sm focus:border-[var(--color-mission-blue)] focus:ring-[var(--color-mission-blue)] focus:outline-none"
			>
				<option value="">Select a target process</option>
				{#each processes as process}
					{#if process.id !== sourceId}
						<option value={process.id}>{process.name}</option>
					{/if}
				{/each}
			</select>
			{#if errors.targetId}
				<p class="mt-1 text-sm text-red-600">{errors.targetId}</p>
			{/if}
		</div>

		<div>
			<label for="wait-time" class="mb-1 block text-sm font-medium text-[var(--color-defense-dark)]"
				>Wait Time</label
			>
			<input
				type="number"
				id="wait-time"
				bind:value={waitTime}
				min="0"
				class="w-full rounded-md border border-[var(--color-light-gray)] px-3 py-2 shadow-sm focus:border-[var(--color-mission-blue)] focus:ring-[var(--color-mission-blue)] focus:outline-none"
			/>
			{#if errors['metrics.waitTime']}
				<p class="mt-1 text-sm text-red-600">{errors['metrics.waitTime']}</p>
			{/if}
		</div>

		<div class="flex items-center">
			<input
				type="checkbox"
				id="is-rework"
				bind:checked={isRework}
				class="h-4 w-4 rounded border-[var(--color-light-gray)] text-[var(--color-action-red)] focus:ring-[var(--color-action-red)]"
			/>
			<label for="is-rework" class="ml-2 block text-sm text-[var(--color-defense-dark)]">
				This is a rework connection
			</label>
		</div>

		<div class="flex justify-end space-x-2">
			<button
				type="button"
				on:click={onCancel}
				aria-label="Cancel connection editing"
				class="rounded-md border border-[var(--color-light-gray)] bg-[var(--color-unicorn-white)] px-4 py-2 text-sm font-medium text-[var(--color-defense-dark)] shadow-sm hover:bg-[var(--color-background-white)] focus:ring-2 focus:ring-[var(--color-mission-blue)] focus:ring-offset-2 focus:outline-none"
			>
				Cancel
			</button>
			<button
				type="submit"
				aria-label="Save connection changes"
				class="rounded-md border border-transparent bg-[var(--color-mission-blue)] px-4 py-2 text-sm font-medium text-[var(--color-unicorn-white)] shadow-sm hover:bg-[var(--color-mission-blue-65)] focus:ring-2 focus:ring-[var(--color-mission-blue)] focus:ring-offset-2 focus:outline-none"
			>
				Save
			</button>
		</div>
	</form>
</div>
