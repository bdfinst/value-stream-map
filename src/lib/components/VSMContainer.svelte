<script>
	import ZoomControls from './ZoomControls.svelte';
	import { onMount } from 'svelte';

	export let zoomController = {};
	export let bindContainer;
	export let storeValue;
	export let renderVSMWithSelection;

	let container;

	onMount(() => {
		if (typeof bindContainer === 'function') {
			bindContainer(container);
		}

		// Create a ResizeObserver to handle container resizing
		const resizeObserver = new ResizeObserver(() => {
			if (container && storeValue?.vsm) {
				// Re-render on resize
				renderVSMWithSelection(storeValue.vsm, storeValue.selection);

				// Fit to screen after a short delay to ensure rendering is complete
				setTimeout(() => {
					if (zoomController.zoomFit) {
						zoomController.zoomFit();
					}
				}, 100);
			}
		});

		// Start observing the container
		if (container) {
			resizeObserver.observe(container);
		}

		// Return cleanup function
		return () => {
			// Stop observing resize events
			resizeObserver.disconnect();
		};
	});
</script>

<div class="mb-8">
	<div
		class="w-full overflow-hidden rounded-md border border-[var(--color-tech-cyan)] bg-[var(--color-unicorn-white)] shadow-lg ring-1 ring-[var(--color-tech-cyan-30)]"
		style="resize: both; min-height: 400px;"
	>
		<div bind:this={container} class="h-full w-full" style="min-height: 400px;"></div>
	</div>

	<ZoomControls {zoomController} />
</div>
