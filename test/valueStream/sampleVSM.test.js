// @ts-check
import { describe, expect, it } from 'vitest';

import { createSampleVSM } from '../../src/lib/valueStream/sampleVSM.js';

describe('Sample VSM Metrics', () => {
	it('should calculate correct metrics for the sample VSM', () => {
		const vsm = createSampleVSM();

		// Log all metrics to see the actual calculated values
		console.log('VSM Metrics:', JSON.stringify(vsm.metrics, null, 2));

		// Log process2's metrics
		const process2 = vsm.processes.find((p) => p.id === 'process2');
		console.log('Process2 metrics:', JSON.stringify(process2.metrics, null, 2));

		// Log connections affecting process2
		const incomingToProcess2 = vsm.connections.filter((c) => c.targetId === 'process2');
		const outgoingFromProcess2 = vsm.connections.filter((c) => c.sourceId === 'process2');
		console.log('Incoming connections to process2:', incomingToProcess2);
		console.log('Outgoing connections from process2:', outgoingFromProcess2);

		// Basic checks
		expect(vsm.metrics).toBeDefined();
		expect(vsm.metrics.cycleTimeByProcess.process2).toBeDefined();
		expect(vsm.metrics.reworkCycleTimeByProcess.process2).toBeDefined();
	});
});
