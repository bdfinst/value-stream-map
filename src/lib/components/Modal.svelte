<script>
	export let show = false;
	export let title = '';
	export let onClose = () => {};

	function handleEscape(event) {
		if (event.key === 'Escape' && show) {
			onClose();
		}
	}

	function handleBackdropClick(event) {
		// Only close if clicking the backdrop, not the modal content
		if (event.target === event.currentTarget) {
			onClose();
		}
	}
</script>

<svelte:window on:keydown={handleEscape} />

{#if show}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-hero-navy-40)]"
		on:click={handleBackdropClick}
		on:keydown={handleEscape}
		role="dialog"
		tabindex="-1"
	>
		<div
			class="mx-4 w-full max-w-md overflow-hidden rounded-lg bg-[var(--color-unicorn-white)] shadow-xl"
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
		>
			<div
				class="flex items-center justify-between border-b border-[var(--color-light-gray)] bg-[var(--color-defense-dark)] px-4 py-3"
			>
				<h3 id="modal-title" class="text-lg font-medium text-[var(--color-unicorn-white)]">
					{title}
				</h3>
				<button
					type="button"
					class="text-[var(--color-unicorn-white)] hover:text-[var(--color-tech-cyan)] focus:outline-none"
					aria-label="Close"
					on:click={onClose}
				>
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
			<div class="p-4">
				<slot></slot>
			</div>
		</div>
	</div>
{/if}
