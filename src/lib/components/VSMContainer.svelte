<script>
	import ZoomControls from './ZoomControls.svelte';
	import MetricsTooltip from './MetricsTooltip.svelte';
	import { onMount } from 'svelte';

	export let zoomController = {};
	export let bindContainer;
	export let storeValue;
	export let renderVSMWithSelection;

	let container;

	// Tooltip state
	let tooltipVisible = false;
	let tooltipX = 0;
	let tooltipY = 0;
	let activeProcess = null;

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
		<div
			bind:this={container}
			class="relative h-full w-full"
			style="min-height: 400px;"
			role="application"
			aria-label="Value Stream Map canvas"
			on:mousemove={(e) => {
				// Check if we're hovering over a process
				const processElement = e.target.closest('.process');
				if (processElement) {
					const processId = processElement.getAttribute('data-id');
					const process = storeValue.vsm.processes.find((p) => p.id === processId);

					if (process) {
						activeProcess = process;
						tooltipVisible = true;
						tooltipX = e.clientX;
						tooltipY = e.clientY;
					}
				} else {
					tooltipVisible = false;
				}
			}}
			on:mouseleave={() => {
				tooltipVisible = false;
			}}
		></div>
	</div>

	<ZoomControls {zoomController} />

	{#if tooltipVisible && activeProcess && storeValue.vsm}
		<MetricsTooltip
			process={activeProcess}
			vsm={storeValue.vsm}
			x={tooltipX}
			y={tooltipY}
			visible={tooltipVisible}
		/>
	{/if}
</div>
