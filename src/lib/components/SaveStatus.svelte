<script>
	import { onMount, onDestroy } from 'svelte';
	import { getAutoSaveStatus } from '../valueStream/filePersistence.js';

	// Props
	export let hasUnsavedChanges = false;

	// State
	let autoSaveStatus = { isEnabled: true, lastSaved: null };
	let timer;

	// Format last saved date
	function formatLastSaved(date) {
		if (!date) return 'Never saved';

		const now = new Date();
		const diffMs = now - date;
		const diffSec = Math.floor(diffMs / 1000);

		if (diffSec < 10) return 'Just now';
		if (diffSec < 60) return `${diffSec} seconds ago`;
		if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`;
		if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;

		return date.toLocaleString();
	}

	// Update the status periodically
	function updateStatus() {
		autoSaveStatus = getAutoSaveStatus();
	}

	onMount(() => {
		// Initial update
		updateStatus();

		// Set up polling every 5 seconds
		timer = setInterval(updateStatus, 5000);
	});

	onDestroy(() => {
		if (timer) clearInterval(timer);
	});
</script>

<div class="save-status">
	{#if hasUnsavedChanges}
		<span class="status unsaved">Unsaved changes</span>
	{:else if autoSaveStatus.isEnabled}
		<span class="status saved">
			{autoSaveStatus.lastSaved
				? `Saved ${formatLastSaved(autoSaveStatus.lastSaved)}`
				: 'Auto-save enabled'}
		</span>
	{:else}
		<span class="status disabled">Auto-save disabled</span>
	{/if}
</div>

<style>
	.save-status {
		display: inline-flex;
		align-items: center;
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		background-color: #f5f5f5;
		color: #666;
	}

	.status {
		display: flex;
		align-items: center;
	}

	.status::before {
		content: '';
		display: inline-block;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		margin-right: 0.5rem;
	}

	.saved::before {
		background-color: #4caf50;
	}

	.unsaved::before {
		background-color: #ff9800;
	}

	.disabled::before {
		background-color: #9e9e9e;
	}
</style>
