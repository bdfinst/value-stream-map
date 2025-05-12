<script>
	export let selection = { selectedIds: [] };
	export let onCreateProcess;
	export let onCreateConnection;
	export let onRemoveSelected;
	export let onAutoArrange = null;
</script>

<div class="mb-4 flex space-x-2">
	<button
		class="flex items-center gap-2 rounded-md bg-[var(--color-mission-blue)] px-4 py-2 text-[var(--color-unicorn-white)] hover:bg-[var(--color-mission-blue-65)]"
		on:click={onCreateProcess}
		aria-label="Add new process block"
	>
		<i class="fas fa-cube"></i>
		Add Process
	</button>

	<button
		class="flex items-center gap-2 rounded-md bg-[var(--color-mission-blue)] px-4 py-2 text-[var(--color-unicorn-white)] hover:bg-[var(--color-mission-blue-65)]"
		on:click={onCreateConnection}
		aria-label="Add new connection between processes"
	>
		<i class="fas fa-link"></i>
		Add Connection
	</button>

	{#if selection && selection.selectedIds.length > 0}
		<button
			class="flex items-center gap-2 rounded-md bg-[var(--color-action-red)] px-4 py-2 text-[var(--color-unicorn-white)] hover:bg-[var(--color-du-dkRed)]"
			on:click={onRemoveSelected}
			aria-label="Remove selected item from the diagram"
		>
			<i class="fas fa-trash-alt"></i>
			Remove Selected
		</button>
	{/if}

	{#if onAutoArrange}
		<button
			class="flex items-center gap-2 rounded-md bg-[var(--color-unicorn-black)] px-4 py-2 text-[var(--color-unicorn-white)] hover:bg-[var(--color-unicorn-black-65)]"
			on:click={onAutoArrange}
			aria-label="Auto arrange processes in optimal flow layout"
		>
			<i class="fas fa-magic"></i>
			Auto Arrange
		</button>
	{/if}
</div>
