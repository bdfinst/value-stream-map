<!-- MetricsTooltip.svelte -->
<script>
	import { formatDecimal } from '$lib/utils/formatters.js';

	// Process for which to show tooltip
	export let process;
	// All processes and connections in the VSM
	export let vsm;
	// Position for the tooltip (optional)
	export let x = 0;
	export let y = 0;
	// Visible state
	export let visible = false;

	// Sort processes by x position (left to right) for determining process flow
	$: sortedProcesses = [...vsm.processes].sort((a, b) => {
		const aX = a.position?.x || 0;
		const bX = b.position?.x || 0;
		return aX - bX;
	});

	// Find the index and next process in the flow (for calculations)
	$: processIndex = sortedProcesses.findIndex((p) => p.id === process.id);
	$: nextProcess =
		processIndex < sortedProcesses.length - 1 ? sortedProcesses[processIndex + 1] : null;

	// Find the next wait time (for rework calculations)
	$: nextWaitTime = nextProcess
		? vsm.connections.find(
				(conn) => conn.sourceId === process.id && conn.targetId === nextProcess.id && !conn.isRework
			)?.metrics?.waitTime || 0
		: 0;

	// Find connections related to this process
	$: incomingConnections = vsm.connections.filter(
		(conn) => conn.targetId === process.id && !conn.isRework
	);
	// Used for wait time calculation
	$: waitTime = incomingConnections.reduce((sum, conn) => sum + (conn.metrics?.waitTime || 0), 0);
	$: incomingRework = vsm.connections.filter(
		(conn) => conn.targetId === process.id && conn.isRework
	);
	$: outgoingRework = vsm.connections.filter(
		(conn) => conn.sourceId === process.id && conn.isRework
	);

	// Calculate metrics
	$: processTime = process.metrics?.processTime || 0;
	$: cycleTime = processTime + waitTime;
	$: completeAccurate = process.metrics?.completeAccurate || 100;
	$: reworkCycleTime = process.metrics?.reworkCycleTime || 0;
	$: reworkProbability = (100 - completeAccurate) / 100;
</script>

{#if visible}
	<div
		class="tooltip fixed z-50 w-[300px] rounded-md border border-gray-200 bg-white p-4 shadow-lg"
		style="left: {x}px; top: {y}px; transform: translate(-50%, -120%);"
	>
		<h3 class="mb-2 border-b pb-1 text-lg font-bold text-[var(--color-mission-blue)]">
			{process.name}
		</h3>

		<div class="space-y-3">
			<div>
				<h4 class="text-sm font-semibold">Cycle Time:</h4>
				<p class="text-sm">
					Process ({formatDecimal(processTime)}) + Wait ({formatDecimal(waitTime)}) =
					<strong>{formatDecimal(cycleTime)}</strong>
				</p>
			</div>

			{#if reworkCycleTime > 0 || completeAccurate < 100}
				<div>
					<h4 class="text-sm font-semibold text-[var(--color-action-red)]">Rework Impact:</h4>
					<p class="text-sm text-[var(--color-action-red)]">
						C/A: {completeAccurate}% ({reworkProbability.toFixed(2)} rework probability)
					</p>

					{#if reworkCycleTime > 0}
						<p class="text-sm text-[var(--color-action-red)]">
							Rework: {formatDecimal(reworkCycleTime)} ({(
								(reworkCycleTime / cycleTime) *
								100
							).toFixed(1)}% of cycle time)
						</p>

						<!-- Calculation breakdown -->
						<div class="mt-1 rounded bg-red-50 p-1 text-xs text-[var(--color-action-red)]">
							<strong>Rework Calculation:</strong>

							{#if incomingRework.length > 0}
								<!-- If this process receives explicit rework -->
								{#each incomingRework as rework}
									{#if vsm.processes.find((p) => p.id === rework.sourceId)}
										<p>
											<strong>Explicit rework from:</strong>
											{vsm.processes.find((p) => p.id === rework.sourceId)?.name}
										</p>
										<p>
											<strong>Source C/A:</strong>
											{vsm.processes.find((p) => p.id === rework.sourceId)?.metrics
												?.completeAccurate || 100}%
										</p>
										<p>
											<strong>Probability:</strong>
											{(100 -
												(vsm.processes.find((p) => p.id === rework.sourceId)?.metrics
													?.completeAccurate || 100)) /
												(100).toFixed(2)}
										</p>
										<p>
											<strong>Rework path:</strong> Rework Wait ({rework.metrics?.waitTime || 0}) +
											This Process ({processTime}) + Next Process Path
										</p>
									{/if}
								{/each}
							{:else if !outgoingRework.length}
								<p>
									<strong>Rework from {(100 - completeAccurate).toFixed(0)}% rejection rate:</strong
									>
								</p>
								{#if processIndex < sortedProcesses.length - 1}
									<!-- If this is a middle process with implicit rework -->
									<p>
										<strong>Implicit rework:</strong>
										{100 - completeAccurate}% returns to this process
									</p>
									<p>
										<strong>Path:</strong> Wait ({waitTime}) + Current ({processTime})
									</p>
									<p>
										Time: ({waitTime} + {processTime}) × {reworkProbability.toFixed(2)} = {formatDecimal(
											reworkCycleTime
										)}
									</p>
								{:else}
									<!-- If this is the last process with implicit rework -->
									<p>
										<strong>Implicit rework:</strong>
										{100 - completeAccurate}% returns to this process
									</p>
									<p>
										<strong>Path:</strong> Rework Wait ({nextWaitTime}) + Current ({processTime})
									</p>
									<p>
										Time: ({nextWaitTime} + {processTime}) × {reworkProbability.toFixed(2)} = {formatDecimal(
											reworkCycleTime
										)}
									</p>
								{/if}
							{:else if outgoingRework.length > 0}
								<!-- If this sends explicit rework elsewhere -->
								{#each outgoingRework as rework}
									{#if vsm.processes.find((p) => p.id === rework.targetId)}
										<p>
											<strong>Sends explicit rework to:</strong>
											{vsm.processes.find((p) => p.id === rework.targetId)?.name}
										</p>
										<p>
											<strong>This C/A:</strong>
											{completeAccurate}%
										</p>
										<p>
											<strong>Rework probability:</strong>
											{reworkProbability.toFixed(2)}
										</p>
									{/if}
								{/each}
							{/if}

							<p class="mt-1">
								<strong>Impact:</strong>
								{formatDecimal(reworkCycleTime)} / {formatDecimal(cycleTime)} = {(
									(reworkCycleTime / cycleTime) *
									100
								).toFixed(1)}%
							</p>
						</div>
					{/if}
				</div>
			{/if}

			{#if incomingRework.length > 0 || outgoingRework.length > 0 || (completeAccurate < 100 && processIndex > 0) || process.id !== sortedProcesses[0]?.id}
				<div>
					<h4 class="text-sm font-semibold">Rework Connections:</h4>

					<!-- Receiving explicit rework -->
					{#if incomingRework.length > 0}
						<p class="text-sm">
							<span class="font-semibold">Receiving from:</span>
							{incomingRework
								.map((conn) => {
									const source = vsm.processes.find((p) => p.id === conn.sourceId);
									return source?.name || conn.sourceId;
								})
								.join(', ')}
						</p>
					{/if}

					<!-- Sending explicit rework -->
					{#if outgoingRework.length > 0}
						<p class="text-sm">
							<span class="font-semibold">Sending to:</span>
							{outgoingRework
								.map((conn) => {
									const target = vsm.processes.find((p) => p.id === conn.targetId);
									return target?.name || conn.targetId;
								})
								.join(', ')}
						</p>
					{/if}

					<!-- This process may reject work -->
					{#if completeAccurate < 100}
						<p class="text-sm text-[var(--color-action-red)]">
							<span class="font-semibold">Next Process:</span>
							C/A {completeAccurate}% ({100 - completeAccurate}% rejection rate)
						</p>

						{#if !outgoingRework.length && processIndex < sortedProcesses.length - 1}
							<p class="text-sm text-[var(--color-action-red)]">
								<span class="font-semibold">Rework flow:</span>
								Rejected work returns to this process
							</p>
						{/if}
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.tooltip {
		pointer-events: none;
	}
</style>
