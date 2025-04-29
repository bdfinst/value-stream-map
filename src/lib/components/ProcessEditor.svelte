<script>
	/** @type {import('../valueStream/processBlock').ProcessBlock} */
	export let process;
	/** @type {Function} */
	export let onSave;
	/** @type {Function} */
	export let onCancel;

	// Create local copies of process data for editing
	let name = process.name;
	let description = process.description || '';
	let processTime = process.metrics?.processTime || 0;
	let completeAccurate = process.metrics?.completeAccurate || 100;

	// Form validation
	let errors = {
		name: '',
		processTime: '',
		completeAccurate: ''
	};

	function validateForm() {
		let isValid = true;

		// Validate name
		if (!name.trim()) {
			errors.name = 'Name is required';
			isValid = false;
		} else {
			errors.name = '';
		}

		// Validate process time
		if (isNaN(processTime) || processTime < 0) {
			errors.processTime = 'Must be a non-negative number';
			isValid = false;
		} else {
			errors.processTime = '';
		}

		// Validate complete and accurate percentage
		if (isNaN(completeAccurate) || completeAccurate < 0 || completeAccurate > 100) {
			errors.completeAccurate = 'Must be a percentage (0-100)';
			isValid = false;
		} else {
			errors.completeAccurate = '';
		}

		return isValid;
	}

	function handleSubmit() {
		if (!validateForm()) return;

		// Create updated process object
		const updatedProcess = {
			...process,
			name,
			description,
			metrics: {
				...process.metrics,
				processTime: Number(processTime),
				completeAccurate: Number(completeAccurate)
			}
		};

		onSave(updatedProcess);
	}
</script>

<div class="rounded-lg bg-white p-4 shadow">
	<h2 class="mb-4 text-xl font-bold">Edit Process</h2>

	<form on:submit|preventDefault={handleSubmit} class="space-y-4">
		<div>
			<label
				for="process-name"
				class="mb-1 block text-sm font-medium text-[var(--color-defense-dark)]">Name</label
			>
			<input
				id="process-name"
				type="text"
				bind:value={name}
				class="w-full rounded-md border border-[var(--color-light-gray)] px-3 py-2 shadow-sm focus:border-[var(--color-mission-blue)] focus:ring-[var(--color-mission-blue)] focus:outline-none"
			/>
			{#if errors.name}
				<p class="mt-1 text-sm text-red-600">{errors.name}</p>
			{/if}
		</div>

		<div>
			<label
				for="process-description"
				class="mb-1 block text-sm font-medium text-[var(--color-defense-dark)]">Description</label
			>
			<textarea
				id="process-description"
				bind:value={description}
				rows="2"
				class="w-full rounded-md border border-[var(--color-light-gray)] px-3 py-2 shadow-sm focus:border-[var(--color-mission-blue)] focus:ring-[var(--color-mission-blue)] focus:outline-none"
			></textarea>
		</div>

		<div>
			<label
				for="process-time"
				class="mb-1 block text-sm font-medium text-[var(--color-defense-dark)]">Process Time</label
			>
			<input
				id="process-time"
				type="number"
				bind:value={processTime}
				min="0"
				step="0.1"
				class="w-full rounded-md border border-[var(--color-light-gray)] px-3 py-2 shadow-sm focus:border-[var(--color-mission-blue)] focus:ring-[var(--color-mission-blue)] focus:outline-none"
			/>
			{#if errors.processTime}
				<p class="mt-1 text-sm text-red-600">{errors.processTime}</p>
			{/if}
		</div>

		<div>
			<label
				for="complete-accurate"
				class="mb-1 block text-sm font-medium text-[var(--color-defense-dark)]"
				>Complete & Accurate (%)</label
			>
			<input
				id="complete-accurate"
				type="number"
				bind:value={completeAccurate}
				min="0"
				max="100"
				step="1"
				class="w-full rounded-md border border-[var(--color-light-gray)] px-3 py-2 shadow-sm focus:border-[var(--color-mission-blue)] focus:ring-[var(--color-mission-blue)] focus:outline-none"
			/>
			<p class="mt-1 text-xs text-gray-500">Percentage of output that doesn't require rework</p>
			{#if errors.completeAccurate}
				<p class="mt-1 text-sm text-red-600">{errors.completeAccurate}</p>
			{/if}
		</div>

		<div class="flex justify-end space-x-2">
			<button
				type="button"
				on:click={onCancel}
				aria-label="Cancel process editing"
				class="rounded-md border border-[var(--color-light-gray)] bg-[var(--color-unicorn-white)] px-4 py-2 text-sm font-medium text-[var(--color-defense-dark)] shadow-sm hover:bg-[var(--color-background-white)] focus:ring-2 focus:ring-[var(--color-mission-blue)] focus:ring-offset-2 focus:outline-none"
			>
				Cancel
			</button>
			<button
				type="submit"
				aria-label="Save process changes"
				class="rounded-md border border-transparent bg-[var(--color-mission-blue)] px-4 py-2 text-sm font-medium text-[var(--color-unicorn-white)] shadow-sm hover:bg-[var(--color-mission-blue-65)] focus:ring-2 focus:ring-[var(--color-mission-blue)] focus:ring-offset-2 focus:outline-none"
			>
				Save
			</button>
		</div>
	</form>
</div>
