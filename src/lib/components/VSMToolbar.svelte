<script>
	import MenuBar from './MenuBar.svelte';
	import SaveStatus from './SaveStatus.svelte';

	export let selection = { selectedIds: [] };
	export let onCreateProcess;
	export let onCreateConnection;
	export let onRemoveSelected;
	export let onAutoArrange = null;
	export let onSave = null;
	export let onSaveAs = null;
	export let onLoad = null;
	export let onNewVSM = null;
	export let onLoadRecent = null;
	export let hasUnsavedChanges = false;

	// Handle file menu events
	function handleSave() {
		if (onSave) onSave();
	}

	function handleSaveAs() {
		if (onSaveAs) onSaveAs();
	}

	function handleLoad() {
		if (onLoad) onLoad();
	}

	function handleNew() {
		if (onNewVSM) onNewVSM();
	}

	function handleLoadRecent(event) {
		if (onLoadRecent) onLoadRecent(event.detail);
	}

	function handleError(event) {
		alert(event.detail.message);
	}
</script>

<div class="mb-4">
	<MenuBar
		{hasUnsavedChanges}
		on:save={handleSave}
		on:save-as={handleSaveAs}
		on:load={handleLoad}
		on:new={handleNew}
		on:load-recent={handleLoadRecent}
		on:error={handleError}
	/>

	<div class="mt-2 flex items-center space-x-2">
		<div class="flex-grow"></div>
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
		<div class="ml-4">
			<SaveStatus {hasUnsavedChanges} />
		</div>
	</div>
</div>
