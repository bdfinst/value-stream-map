<script>
	import { validateConnection } from '../valueStream/connectionEditor.js';

	/** @type {import('../valueStream/connection').Connection} */
	export let connection;
	/** @type {Array} - List of all processes for selection */
	export let processes = [];
	/** @type {Function} */
	export let onSave;
	/** @type {Function} */
	export let onCancel;

	// Create local copies of connection data for editing
	let sourceId = connection.sourceId;
	let targetId = connection.targetId;
	let waitTime = connection.metrics?.waitTime || 0;
	let isRework = connection.isRework || false;

	// Form validation
	let errors = {};

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
</script>

<div class="rounded-lg bg-white p-4 shadow">
	<h2 class="mb-4 text-xl font-bold">Edit Connection</h2>

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
