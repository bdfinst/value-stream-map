<script>
	import { onMount, createEventDispatcher } from 'svelte';
	import {
		isFileSystemAccessSupported,
		getRecentFiles,
		setAutoSaveEnabled,
		getAutoSaveStatus,
		initialize
	} from '../valueStream/filePersistence.js';

	// Event dispatcher for VSM operations
	const dispatch = createEventDispatcher();

	// Props
	export let hasUnsavedChanges = false;

	// State
	let fileMenuOpen = false;
	let recentFiles = [];
	let autoSaveStatus = { isEnabled: true, lastSaved: null };
	let isApiSupported = false;
	let saveInProgress = false;
	let loadInProgress = false;

	// Format date as relative time
	function formatLastSaved(date) {
		if (!date) return 'Never';

		const now = new Date();
		const diffMs = now - date;
		const diffSec = Math.floor(diffMs / 1000);

		if (diffSec < 60) return 'Just now';
		if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`;
		if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;

		return date.toLocaleString();
	}

	// Handle auto-save toggle
	function toggleAutoSave() {
		setAutoSaveEnabled(!autoSaveStatus.isEnabled);
		autoSaveStatus = getAutoSaveStatus();
	}

	// Handle save
	async function handleSave() {
		if (saveInProgress) return;

		try {
			saveInProgress = true;
			dispatch('save');
		} catch (error) {
			console.error('Error saving VSM:', error);
			dispatch('error', { message: `Failed to save: ${error.message}` });
		} finally {
			saveInProgress = false;
			fileMenuOpen = false;
		}
	}

	// Handle save as
	async function handleSaveAs() {
		if (saveInProgress) return;

		try {
			saveInProgress = true;
			dispatch('save-as');
		} catch (error) {
			console.error('Error saving VSM:', error);
			dispatch('error', { message: `Failed to save: ${error.message}` });
		} finally {
			saveInProgress = false;
			fileMenuOpen = false;
		}
	}

	// Handle load
	async function handleLoad() {
		if (loadInProgress) return;

		try {
			loadInProgress = true;

			// Check for unsaved changes before loading
			if (hasUnsavedChanges) {
				const confirmLoad = confirm('You have unsaved changes. Load a new VSM anyway?');
				if (!confirmLoad) {
					loadInProgress = false;
					return;
				}
			}

			dispatch('load');
		} catch (error) {
			console.error('Error loading VSM:', error);
			dispatch('error', { message: `Failed to load: ${error.message}` });
		} finally {
			loadInProgress = false;
			fileMenuOpen = false;
		}
	}

	// Handle new VSM
	function handleNew() {
		if (hasUnsavedChanges) {
			const confirmNew = confirm('You have unsaved changes. Create a new VSM anyway?');
			if (!confirmNew) return;
		}

		dispatch('new');
		fileMenuOpen = false;
	}

	// Handle load from recent file
	function handleLoadRecent(fileInfo) {
		if (hasUnsavedChanges) {
			const confirmLoad = confirm('You have unsaved changes. Load a new VSM anyway?');
			if (!confirmLoad) return;
		}

		dispatch('load-recent', fileInfo);
		fileMenuOpen = false;
	}

	// Toggle file menu
	function toggleFileMenu() {
		fileMenuOpen = !fileMenuOpen;

		if (fileMenuOpen) {
			// Refresh recent files and auto-save status when menu is opened
			recentFiles = getRecentFiles();
			autoSaveStatus = getAutoSaveStatus();
		}
	}

	// Handle click outside to close menu
	function handleClickOutside(event) {
		const menu = document.querySelector('.file-menu');
		const menuTrigger = document.querySelector('.menu-trigger.file');

		if (
			fileMenuOpen &&
			menu &&
			!menu.contains(event.target) &&
			!menuTrigger.contains(event.target)
		) {
			fileMenuOpen = false;
		}
	}

	// Initialize on mount
	onMount(() => {
		initialize();
		isApiSupported = isFileSystemAccessSupported();
		recentFiles = getRecentFiles();
		autoSaveStatus = getAutoSaveStatus();

		// Add click outside listener
		document.addEventListener('click', handleClickOutside);

		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<div class="menu-bar">
	<div class="menu-item">
		<button class="menu-trigger file" on:click={toggleFileMenu}>
			File
			{#if hasUnsavedChanges}
				<span class="unsaved-indicator">●</span>
			{/if}
		</button>

		{#if fileMenuOpen}
			<div class="dropdown-menu file-menu">
				<div class="menu-option" on:click={handleNew}>
					<span>New</span>
					<span class="shortcut">Ctrl+N</span>
				</div>

				<div class="menu-option" on:click={handleLoad}>
					<span>Open...</span>
					<span class="shortcut">Ctrl+O</span>
				</div>

				<hr class="menu-divider" />

				<div class="menu-option" on:click={handleSave}>
					<span>Save</span>
					<span class="shortcut">Ctrl+S</span>
					{#if autoSaveStatus.lastSaved}
						<small>Last saved: {formatLastSaved(autoSaveStatus.lastSaved)}</small>
					{/if}
				</div>

				<div class="menu-option" on:click={handleSaveAs}>
					<span>Save As...</span>
					<span class="shortcut">Ctrl+Shift+S</span>
				</div>

				<hr class="menu-divider" />

				<div class="menu-option toggle-option">
					<span>Auto-save</span>
					<label class="toggle">
						<input type="checkbox" checked={autoSaveStatus.isEnabled} on:change={toggleAutoSave} />
						<span class="slider round"></span>
					</label>
				</div>

				{#if recentFiles.length > 0}
					<hr class="menu-divider" />
					<div class="menu-section">Recent Files</div>

					{#each recentFiles as file}
						<div class="menu-option recent-file" on:click={() => handleLoadRecent(file)}>
							<span>{file.title}</span>
							<small>{new Date(file.timestamp).toLocaleDateString()}</small>
						</div>
					{/each}
				{/if}

				{#if !isApiSupported}
					<hr class="menu-divider" />
					<div class="api-warning">
						Your browser doesn't support the File System Access API. Using download/upload fallback.
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<div class="menu-item">
		<button class="menu-trigger">Help</button>
	</div>
</div>

<style>
	.menu-bar {
		display: flex;
		background-color: var(--color-hero-navy, #192036);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		margin-bottom: 0.5rem;
	}

	.menu-item {
		position: relative;
	}

	.menu-trigger {
		display: flex;
		align-items: center;
		background: none;
		border: none;
		padding: 0.5rem 1rem;
		font-size: 0.9rem;
		font-weight: medium;
		cursor: pointer;
		color: var(--color-unicorn-white, #fff);
		transition: background-color 0.2s;
	}

	.menu-trigger:hover {
		background-color: rgba(255, 255, 255, 0.1);
	}

	.menu-trigger.active {
		background-color: rgba(255, 255, 255, 0.15);
	}

	.unsaved-indicator {
		margin-left: 0.25rem;
		color: #ff6b6b;
		font-size: 0.7rem;
	}

	.dropdown-menu {
		position: absolute;
		top: 100%;
		left: 0;
		background: white;
		color: #333;
		border: 1px solid #ddd;
		border-radius: 4px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		min-width: 220px;
		z-index: 100;
		overflow: hidden;
	}

	.menu-option {
		padding: 0.6rem 1rem;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		transition: background-color 0.1s;
	}

	.menu-option:hover {
		background-color: #f5f5f5;
	}

	.shortcut {
		font-size: 0.75rem;
		color: #888;
		margin-top: 0.25rem;
		align-self: flex-end;
	}

	.menu-option small {
		font-size: 0.7rem;
		color: #888;
		margin-top: 0.25rem;
	}

	.menu-divider {
		border: none;
		border-top: 1px solid #eee;
		margin: 0.25rem 0;
	}

	.menu-section {
		padding: 0.25rem 1rem;
		font-size: 0.75rem;
		color: #888;
		font-weight: bold;
		background-color: #f9f9f9;
	}

	.toggle-option {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
	}

	.toggle {
		position: relative;
		display: inline-block;
		width: 36px;
		height: 20px;
	}

	.toggle input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #ccc;
		transition: 0.3s;
	}

	.slider:before {
		position: absolute;
		content: '';
		height: 16px;
		width: 16px;
		left: 2px;
		bottom: 2px;
		background-color: white;
		transition: 0.3s;
	}

	input:checked + .slider {
		background-color: #2196f3;
	}

	input:focus + .slider {
		box-shadow: 0 0 1px #2196f3;
	}

	input:checked + .slider:before {
		transform: translateX(16px);
	}

	.slider.round {
		border-radius: 20px;
	}

	.slider.round:before {
		border-radius: 50%;
	}

	.api-warning {
		padding: 0.5rem 1rem;
		font-size: 0.75rem;
		color: #e67e22;
		background-color: #fff3e0;
	}

	.recent-file {
		border-left: 3px solid transparent;
	}

	.recent-file:hover {
		border-left-color: #2196f3;
	}
</style>
