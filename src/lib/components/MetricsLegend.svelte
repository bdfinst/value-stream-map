<script>
	/**
	 * Component that displays a legend with tooltips for metrics
	 */

	// List of all metrics with their explanations
	const metrics = [
		{
			id: 'pt',
			label: 'PT',
			name: 'Process Time',
			color: '#2d3748',
			description:
				'The time it takes to process a single unit of work. This is the actual value-adding time.'
		},
		{
			id: 'wt',
			label: 'WT',
			name: 'Wait Time',
			color: '#4a5568',
			description:
				'The time a unit spends waiting between processes. Shown on connections between processes.'
		},
		{
			id: 'ct',
			label: 'CT',
			name: 'Cycle Time',
			color: '#2b6cb0',
			description:
				'The total time for a process, including both process time and incoming wait time.'
		},
		{
			id: 'rt',
			label: 'RT',
			name: 'Rework Time',
			color: '#e53e3e',
			description:
				'Additional time spent when work needs to be redone due to quality issues or feedback loops.'
		},
		{
			id: 'ca',
			label: '%C/A',
			name: 'Complete & Accurate',
			color: '#38a169',
			description:
				"Percentage of work that is done correctly the first time and doesn't require rework."
		}
	];

	// Value stream level metrics
	const vsmMetrics = [
		{
			id: 'leadTime',
			name: 'Lead Time',
			description: 'The total time from start to finish of the entire value stream (best case).'
		},
		{
			id: 'valueAddedTime',
			name: 'Value-Added Time',
			description:
				'The sum of all process times, representing work that actually transforms the product.'
		},
		{
			id: 'valueAddedRatio',
			name: 'Value-Added Ratio',
			description:
				'The percentage of total lead time that actually adds value (Value-Added Time ÷ Lead Time).'
		},
		{
			id: 'worstCase',
			name: 'Worst Case Lead Time',
			description:
				'The total lead time when accounting for all possible rework loops and quality issues.'
		},
		{
			id: 'reworkTime',
			name: 'Total Rework Time',
			description: 'The additional time spent on rework across the entire value stream.'
		},
		{
			id: 'reworkImpact',
			name: 'Rework Impact',
			description:
				'The percentage increase in lead time due to rework (Total Rework Time ÷ Lead Time).'
		}
	];

	// Controls whether tooltips are shown on hover or click (for mobile)
	const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
</script>

<div
	class="metrics-legend mx-auto max-w-3xl rounded-md border border-[var(--color-light-gray)] bg-[var(--color-unicorn-white)] p-5"
>
	<div class="mb-5">
		<p class="mb-2 text-sm text-[var(--color-mission-blue)]">
			Hover over any item for a detailed description.
		</p>
	</div>

	<div class="grid gap-6 sm:grid-cols-2">
		<div
			class="rounded-md border border-[var(--color-light-gray)] bg-[var(--color-background-white)] p-4"
		>
			<h4 class="mb-3 text-sm font-medium text-[var(--color-defense-dark)]">
				Process & Connection Metrics
			</h4>
			<ul class="space-y-3">
				{#each metrics as metric}
					<li class="group relative flex items-center border-b border-gray-100 pb-2">
						<span class="inline-block w-8 text-center font-bold" style="color: {metric.color};">
							{metric.label}
						</span>
						<span class="text-sm text-gray-700">{metric.name}</span>

						<!-- Info icon with tooltip -->
						<div class="relative ml-auto inline-block">
							<button
								class="text-[var(--color-tech-cyan)] hover:text-[var(--color-mission-blue)] focus:outline-none"
								aria-label={`Information about ${metric.name}`}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
										clip-rule="evenodd"
									/>
								</svg>
							</button>

							<!-- Tooltip -->
							<div
								class="invisible absolute bottom-full left-0 z-10 mb-1 w-60 -translate-x-3/4 rounded-md bg-gray-700 px-3
                          py-2 text-left text-sm text-white
                          opacity-0 shadow-lg transition-opacity duration-300 group-hover:visible group-hover:opacity-100"
							>
								{metric.description}
								<div
									class="absolute -bottom-1 left-3/4 h-2 w-2 -translate-x-1/2 rotate-45 transform bg-gray-700"
								></div>
							</div>
						</div>
					</li>
				{/each}
			</ul>
		</div>

		<div
			class="rounded-md border border-[var(--color-light-gray)] bg-[var(--color-background-white)] p-4"
		>
			<h4 class="mb-3 text-sm font-medium text-[var(--color-defense-dark)]">
				Value Stream Metrics
			</h4>
			<ul class="space-y-3">
				{#each vsmMetrics as metric}
					<li class="group relative flex items-center border-b border-gray-100 pb-2">
						<span class="text-sm text-gray-700">{metric.name}</span>

						<!-- Info icon with tooltip -->
						<div class="relative ml-auto inline-block">
							<button
								class="text-[var(--color-tech-cyan)] hover:text-[var(--color-mission-blue)] focus:outline-none"
								aria-label={`Information about ${metric.name}`}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
										clip-rule="evenodd"
									/>
								</svg>
							</button>

							<!-- Tooltip -->
							<div
								class="invisible absolute bottom-full left-0 z-10 mb-1 w-60 -translate-x-3/4 rounded-md bg-gray-700 px-3
                          py-2 text-left text-sm text-white
                          opacity-0 shadow-lg transition-opacity duration-300 group-hover:visible group-hover:opacity-100"
							>
								{metric.description}
								<div
									class="absolute -bottom-1 left-3/4 h-2 w-2 -translate-x-1/2 rotate-45 transform bg-gray-700"
								></div>
							</div>
						</div>
					</li>
				{/each}
			</ul>
		</div>
	</div>

	<div
		class="mt-6 rounded-md border border-[var(--color-light-gray)] bg-[var(--color-background-white)] p-4"
	>
		<h4 class="mb-3 text-sm font-medium text-[var(--color-defense-dark)]">Visual Elements</h4>
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
			<div class="group relative flex items-center">
				<div class="mr-2 h-2 w-8 rounded-sm bg-gray-500"></div>
				<span class="text-sm text-gray-700">Normal Flow</span>
			</div>
			<div class="group relative flex items-center">
				<div class="mr-2 h-2 w-8 rounded-sm bg-red-500"></div>
				<span class="text-sm text-gray-700">Rework Flow</span>
			</div>
			<div class="group relative flex items-center">
				<div
					class="mr-2 flex h-5 w-5 items-center justify-center rounded-sm border border-red-500 text-xs font-bold text-red-500"
				>
					R
				</div>
				<span class="text-sm text-gray-700">Rework Time</span>
			</div>
			<div class="group relative flex items-center">
				<div
					class="mr-2 flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 bg-gray-50 text-xs text-gray-500"
				>
					WT
				</div>
				<span class="text-sm text-gray-700">Wait Time Label</span>
			</div>
			<div class="group relative flex items-center">
				<div
					class="mr-2 flex h-6 w-6 items-center justify-center rounded-sm border border-gray-300 bg-gray-50 text-xs text-green-600"
				>
					98%
				</div>
				<span class="text-sm text-gray-700">C/A Percentage</span>
			</div>
		</div>
	</div>
</div>
