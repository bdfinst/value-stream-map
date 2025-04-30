// @ts-nocheck
import { describe, expect, it } from 'vitest';

import { connection, createVSM, processBlock } from '../../src/lib/valueStream';

describe('Rework Specification Tests', () => {
	/**
	 * Test cases from the Rework Scenarios Specification document
	 */
	describe('No Rework Scenarios', () => {
		it('Basic value stream with no rework', () => {
			// Given a value stream with 3 processes
			const step1 = processBlock.create({
				id: 'step1',
				name: 'Step 1',
				position: { x: 100, y: 100 },
				metrics: { processTime: 10, completeAccurate: 100 }
			});

			const step2 = processBlock.create({
				id: 'step2',
				name: 'Step 2',
				position: { x: 250, y: 100 },
				metrics: { processTime: 20, completeAccurate: 100 }
			});

			const step3 = processBlock.create({
				id: 'step3',
				name: 'Step 3',
				position: { x: 400, y: 100 },
				metrics: { processTime: 30 }
			});

			// And connections between processes
			const conn1 = connection.create({
				id: 'conn1',
				sourceId: 'step1',
				targetId: 'step2',
				metrics: { waitTime: 5 }
			});

			const conn2 = connection.create({
				id: 'conn2',
				sourceId: 'step2',
				targetId: 'step3',
				metrics: { waitTime: 10 }
			});

			// When the VSM metrics are calculated
			const vsm = createVSM.create({
				id: 'vsm1',
				title: 'No Rework VSM',
				processes: [step1, step2, step3],
				connections: [conn1, conn2]
			});

			// Then the cycle times should be as expected
			expect(vsm.metrics.cycleTimeByProcess.step1).toBe(10);
			expect(vsm.metrics.cycleTimeByProcess.step2).toBe(25);
			expect(vsm.metrics.cycleTimeByProcess.step3).toBe(40);

			// And the lead time should be 75
			expect(vsm.metrics.totalLeadTime).toBe(75);

			// And the total rework time should be 0
			expect(vsm.metrics.totalReworkTime).toBe(0);

			// And the worst-case lead time should be 75
			expect(vsm.metrics.worstCaseLeadTime).toBe(75);

			// Last process shouldn't have C/A set according to spec
			expect(step3.metrics.completeAccurate).toBeUndefined();
		});

		it('Value stream with different wait times', () => {
			// Given a value stream with 4 processes
			const stepA = processBlock.create({
				id: 'stepA',
				name: 'Step A',
				position: { x: 100, y: 100 },
				metrics: { processTime: 2, completeAccurate: 100 }
			});

			const stepB = processBlock.create({
				id: 'stepB',
				name: 'Step B',
				position: { x: 200, y: 100 },
				metrics: { processTime: 3, completeAccurate: 100 }
			});

			const stepC = processBlock.create({
				id: 'stepC',
				name: 'Step C',
				position: { x: 300, y: 100 },
				metrics: { processTime: 4, completeAccurate: 100 }
			});

			const stepD = processBlock.create({
				id: 'stepD',
				name: 'Step D',
				position: { x: 400, y: 100 },
				metrics: { processTime: 3 }
			});

			// And connections between processes
			const connAB = connection.create({
				id: 'connAB',
				sourceId: 'stepA',
				targetId: 'stepB',
				metrics: { waitTime: 1 }
			});

			const connBC = connection.create({
				id: 'connBC',
				sourceId: 'stepB',
				targetId: 'stepC',
				metrics: { waitTime: 2 }
			});

			const connCD = connection.create({
				id: 'connCD',
				sourceId: 'stepC',
				targetId: 'stepD',
				metrics: { waitTime: 1 }
			});

			// When the VSM metrics are calculated
			const vsm = createVSM.create({
				id: 'vsm2',
				title: 'Different Wait Times VSM',
				processes: [stepA, stepB, stepC, stepD],
				connections: [connAB, connBC, connCD]
			});

			// Then the cycle times should be as expected
			expect(vsm.metrics.cycleTimeByProcess.stepA).toBe(2);
			expect(vsm.metrics.cycleTimeByProcess.stepB).toBe(4);
			expect(vsm.metrics.cycleTimeByProcess.stepC).toBe(6);
			expect(vsm.metrics.cycleTimeByProcess.stepD).toBe(4);

			// And the lead time should be 16
			expect(vsm.metrics.totalLeadTime).toBe(16);

			// And the total rework time should be 0
			expect(vsm.metrics.totalReworkTime).toBe(0);

			// And the worst-case lead time should be 16
			expect(vsm.metrics.worstCaseLeadTime).toBe(16);
		});
	});

	describe('Implicit Rework Scenarios', () => {
		it('Value stream with implicit rework', () => {
			// Given a value stream with 4 processes
			const step1 = processBlock.create({
				id: 'step1',
				name: 'Step 1',
				position: { x: 100, y: 100 },
				metrics: { processTime: 10, completeAccurate: 90 }
			});

			const step2 = processBlock.create({
				id: 'step2',
				name: 'Step 2',
				position: { x: 250, y: 100 },
				metrics: { processTime: 20, completeAccurate: 80 }
			});

			const step3 = processBlock.create({
				id: 'step3',
				name: 'Step 3',
				position: { x: 400, y: 100 },
				metrics: { processTime: 30, completeAccurate: 70 }
			});

			const step4 = processBlock.create({
				id: 'step4',
				name: 'Step 4',
				position: { x: 550, y: 100 },
				metrics: { processTime: 5 }
			});

			// And connections between processes
			const conn1 = connection.create({
				id: 'conn1',
				sourceId: 'step1',
				targetId: 'step2',
				metrics: { waitTime: 5 }
			});

			const conn2 = connection.create({
				id: 'conn2',
				sourceId: 'step2',
				targetId: 'step3',
				metrics: { waitTime: 10 }
			});

			const conn3 = connection.create({
				id: 'conn3',
				sourceId: 'step3',
				targetId: 'step4',
				metrics: { waitTime: 5 }
			});

			// When the VSM metrics are calculated
			const vsm = createVSM.create({
				id: 'vsm3',
				title: 'Implicit Rework VSM',
				processes: [step1, step2, step3, step4],
				connections: [conn1, conn2, conn3]
			});

			// Then the cycle times should be as expected
			expect(vsm.metrics.cycleTimeByProcess.step1).toBe(10);
			expect(vsm.metrics.cycleTimeByProcess.step2).toBe(25);
			expect(vsm.metrics.cycleTimeByProcess.step3).toBe(40);
			expect(vsm.metrics.cycleTimeByProcess.step4).toBe(10);

			// According to the spec
			expect(vsm.metrics.reworkCycleTimeByProcess.step1).toBeCloseTo(1, 1); // 0.1 * 10 = 1
			expect(vsm.metrics.reworkCycleTimeByProcess.step2).toBeCloseTo(5, 1); // 0.2 * 25 = 5
			expect(vsm.metrics.reworkCycleTimeByProcess.step3).toBeCloseTo(12, 1); // 0.3 * 40 = 12

			// And the lead time should be 85
			expect(vsm.metrics.totalLeadTime).toBe(85);

			// And the total rework time should be 18 according to spec
			expect(vsm.metrics.totalReworkTime).toBeCloseTo(18, 1);

			// And the worst-case lead time is 103 according to spec
			expect(vsm.metrics.worstCaseLeadTime).toBeCloseTo(103, 1);
		});
	});

	describe('Explicit Rework Scenarios', () => {
		it('Rework from last process to first process', () => {
			// Given a value stream with 4 processes
			const step1 = processBlock.create({
				id: 'step1',
				name: 'Step 1',
				position: { x: 100, y: 100 },
				metrics: { processTime: 10, completeAccurate: 90 }
			});

			const step2 = processBlock.create({
				id: 'step2',
				name: 'Step 2',
				position: { x: 250, y: 100 },
				metrics: { processTime: 20, completeAccurate: 80 }
			});

			const step3 = processBlock.create({
				id: 'step3',
				name: 'Step 3',
				position: { x: 400, y: 100 },
				metrics: { processTime: 30, completeAccurate: 70 }
			});

			const step4 = processBlock.create({
				id: 'step4',
				name: 'Step 4',
				position: { x: 550, y: 100 },
				metrics: { processTime: 10 }
			});

			// And connections between processes
			const conn1 = connection.create({
				id: 'conn1',
				sourceId: 'step1',
				targetId: 'step2',
				metrics: { waitTime: 5 }
			});

			const conn2 = connection.create({
				id: 'conn2',
				sourceId: 'step2',
				targetId: 'step3',
				metrics: { waitTime: 10 }
			});

			const conn3 = connection.create({
				id: 'conn3',
				sourceId: 'step3',
				targetId: 'step4',
				metrics: { waitTime: 10 }
			});

			const reworkConn = connection.create({
				id: 'rework1',
				sourceId: 'step3',
				targetId: 'step1',
				metrics: { waitTime: 15 },
				isRework: true
			});

			// When the VSM metrics are calculated
			const vsm = createVSM.create({
				id: 'vsm4',
				title: 'Explicit Rework VSM',
				processes: [step1, step2, step3, step4],
				connections: [conn1, conn2, conn3, reworkConn]
			});

			// Then the cycle times should be as expected
			expect(vsm.metrics.cycleTimeByProcess.step1).toBe(10);
			expect(vsm.metrics.cycleTimeByProcess.step2).toBe(25);
			expect(vsm.metrics.cycleTimeByProcess.step3).toBe(40);
			expect(vsm.metrics.cycleTimeByProcess.step4).toBe(20);

			// Check rework times according to updated implementation
			// Step 1 now gets the rework time from explicit rework connection from Step 3
			expect(vsm.metrics.reworkCycleTimeByProcess.step1).toBeCloseTo(27, 1); // 0.3 * (15 + 10 + 5 + 20 + 10 + 30) = 27
			expect(vsm.metrics.reworkCycleTimeByProcess.step2).toBeCloseTo(5, 1); // 0.2 * 25 = 5

			// And the lead time should be 95
			expect(vsm.metrics.totalLeadTime).toBe(95);

			// The total rework time is 27 + 5 = 32 according to updated implementation
			expect(vsm.metrics.totalReworkTime).toBeCloseTo(32, 1);

			// And the worst-case lead time is 95 + 32 = 127 according to updated implementation
			expect(vsm.metrics.worstCaseLeadTime).toBeCloseTo(127, 1);
		});
	});

	describe('Data Entry Rules', () => {
		it('Last process should not have editable C/A field', () => {
			// This is a UI test and would be validated in a component or E2E test rather than in unit tests
			// This test serves as a documentation of the requirement

			// Create a simple VSM
			const step1 = processBlock.create({
				id: 'step1',
				name: 'Step 1',
				position: { x: 100, y: 100 },
				metrics: { processTime: 10, completeAccurate: 90 }
			});

			const step2 = processBlock.create({
				id: 'step2',
				name: 'Step 2',
				position: { x: 250, y: 100 },
				metrics: { processTime: 20 }
			});

			const conn1 = connection.create({
				id: 'conn1',
				sourceId: 'step1',
				targetId: 'step2',
				metrics: { waitTime: 5 }
			});

			// Create VSM
			const vsm = createVSM.create({
				id: 'vsm-rules',
				title: 'VSM Rules Test',
				processes: [step1, step2],
				connections: [conn1]
			});

			// Verify first process has C/A set
			expect(step1.metrics.completeAccurate).toBe(90);

			// According to spec, last process shouldn't have C/A set
			expect(step2.metrics.completeAccurate).toBeUndefined();

			// This is the rule we're testing: Last process shouldn't have C/A set
			const lastProcess = vsm.processes.find((p) => p.id === 'step2');
			expect(lastProcess.metrics.completeAccurate).toBeUndefined();
		});

		it('First process should not have a wait time', () => {
			// Create a simple VSM
			const step1 = processBlock.create({
				id: 'step1',
				name: 'Step 1',
				position: { x: 100, y: 100 },
				metrics: { processTime: 10, completeAccurate: 90 }
			});

			const step2 = processBlock.create({
				id: 'step2',
				name: 'Step 2',
				position: { x: 250, y: 100 },
				metrics: { processTime: 20 }
			});

			const conn1 = connection.create({
				id: 'conn1',
				sourceId: 'step1',
				targetId: 'step2',
				metrics: { waitTime: 5 }
			});

			// Create VSM
			const vsm = createVSM.create({
				id: 'vsm-rules',
				title: 'VSM Rules Test',
				processes: [step1, step2],
				connections: [conn1]
			});

			// Validate that the first process doesn't include wait time in its cycle time
			expect(vsm.metrics.cycleTimeByProcess.step1).toBe(10); // Just process time, no wait time
		});
	});
});
