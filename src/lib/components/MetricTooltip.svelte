<!-- MetricTooltip.svelte -->
<script>
	import katex from 'katex';
	import { onMount } from 'svelte';
	import 'katex/dist/katex.min.css';

	// Title of the metric
	export let title = '';
	// Explanation of how the metric is calculated
	export let explanation = '';
	// Calculation formula
	export let formula = '';
	// Example of the calculation
	export let example = '';
	// Position for the tooltip (optional)
	export let x = 0;
	export let y = 0;
	// Visible state
	export let visible = false;

	let formulaElement;

	$: if (visible && formula && formulaElement) {
		renderFormula();
	}

	function renderFormula() {
		if (formulaElement) {
			katex.render(formula, formulaElement, {
				throwOnError: false,
				displayMode: true
			});
		}
	}

	onMount(() => {
		if (visible && formula && formulaElement) {
			renderFormula();
		}
	});
</script>

{#if visible}
	<div
		class="metric-tooltip fixed z-50 w-[300px] rounded-md border border-gray-200 bg-white p-4 shadow-lg"
		style="left: {x}px; top: {y}px; transform: translate(-50%, -120%);"
	>
		<h3 class="mb-2 border-b pb-1 text-lg font-bold text-[var(--color-mission-blue)]">{title}</h3>

		<div class="space-y-3">
			<div>
				<p class="text-sm">{explanation}</p>
			</div>

			{#if formula}
				<div>
					<h4 class="text-sm font-semibold">Formula:</h4>
					<div class="flex justify-center rounded bg-gray-100 p-2">
						<div bind:this={formulaElement} class="formula-container"></div>
					</div>
				</div>
			{/if}

			{#if example}
				<div>
					<h4 class="text-sm font-semibold">Example:</h4>
					<p class="text-sm">
						{example}
					</p>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.metric-tooltip {
		pointer-events: none;
	}

	.formula-container {
		min-height: 2rem;
	}

	:global(.katex) {
		font-size: 0.9em;
	}
</style>
