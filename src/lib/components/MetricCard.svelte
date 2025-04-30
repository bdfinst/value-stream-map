<script>
	import MetricTooltip from './MetricTooltip.svelte';

	export let title = '';
	export let value = '';
	export let isException = false;

	// Tooltip state
	let tooltipVisible = false;
	let tooltipX = 0;
	let tooltipY = 0;

	// Tooltip content based on metric type
	let explanation = '';
	let formula = '';
	let example = '';

	$: {
		switch (title) {
			case 'Lead Time':
				explanation = 'Total time for work to flow through entire process';
				formula = '\\text{Lead Time} = \\sum{\\text{Cycle Times}}';
				example = 'Process1 (10) + Process2 (15) + Process3 (20) = 45';
				break;

			case 'Value-Added Time':
				explanation = 'Sum of actual process times (excluding wait time)';
				formula = '\\text{VA Time} = \\sum{\\text{Process Times}}';
				example = 'Process1 (5) + Process2 (10) + Process3 (15) = 30';
				break;

			case 'Value-Added Ratio':
				explanation = 'Percentage of time spent on value-adding activities';
				formula = '\\text{VA Ratio} = \\frac{\\text{VA Time}}{\\text{Lead Time}} \\times 100\\%';
				example = '30 / 45 * 100% = 66.7%';
				break;

			case 'Exception Lead Time':
				explanation = 'Worst-case lead time with all rework paths';
				formula = '\\text{ELT} = \\text{Lead Time} + \\sum{\\text{Rework Times}}';
				example = '45 + 20 = 65';
				break;

			case 'Total Rework Time':
				explanation = 'Weighted sum of all rework times';
				formula = '\\text{TRT} = \\sum{(\\text{Rework Path} \\times \\text{Probability})}';
				example = '10×0.2 + 15×0.3 = 2 + 4.5 = 6.5';
				break;

			case 'Rework Impact':
				explanation = 'Percentage increase in lead time from rework';
				formula =
					'\\text{Rework Impact} = \\frac{\\text{Total Rework}}{\\text{Lead Time}} \\times 100\\%';
				example = '6.5 / 45 * 100% = 14.4%';
				break;

			default:
				explanation = 'Metric calculation details';
		}
	}

	// Show tooltip on hover
	function showTooltip(event) {
		tooltipVisible = true;
		tooltipX = event.clientX;
		tooltipY = event.clientY;
	}

	function hideTooltip() {
		tooltipVisible = false;
	}
</script>

<div
	class={`relative rounded-md border p-4 text-center ${
		isException
			? 'border-[var(--color-action-red)] bg-[var(--color-unicorn-white)]'
			: 'border-[var(--color-light-gray)] bg-[var(--color-background-white)]'
	}`}
>
	<div class="mb-1 flex items-center justify-between">
		<h3 class="text-sm font-medium text-[var(--color-mission-blue)]">{title}</h3>
		<button
			class="text-xs text-gray-500 hover:text-[var(--color-mission-blue)] focus:outline-none"
			aria-label="Show metric explanation"
			on:mouseenter={showTooltip}
			on:mouseleave={hideTooltip}
			on:focus={showTooltip}
			on:blur={hideTooltip}
		>
			<i class="fas fa-question-circle"></i>
		</button>
	</div>

	<p
		class={`mt-2 text-2xl font-bold ${
			isException ? 'text-[var(--color-action-red)]' : 'text-[var(--color-defense-dark)]'
		}`}
	>
		{value}
	</p>

	<MetricTooltip
		{title}
		{explanation}
		{formula}
		{example}
		x={tooltipX}
		y={tooltipY}
		visible={tooltipVisible}
	/>
</div>
