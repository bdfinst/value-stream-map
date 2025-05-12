import { describe, it, expect, beforeEach } from 'vitest';
import autoLayout from '../../src/lib/valueStream/autoLayout.js';
import vsmCreator from '../../src/lib/valueStream/createVSM.js';
import { processBlock, connection } from '../../src/lib/valueStream';

describe('Improved Auto Layout and Positioning', () => {
	// Sample VSM for testing with complex connections
	let complexVSM;

	beforeEach(() => {
		// Create a more complex test VSM with multiple parallel paths and rework
		const p1 = processBlock.create({
			id: 'p1',
			name: 'Process 1',
			position: { x: 100, y: 100 },
			metrics: { processTime: 10, completeAccurate: 95 }
		});

		const p2 = processBlock.create({
			id: 'p2',
			name: 'Process 2A',
			position: { x: 300, y: 50 },
			metrics: { processTime: 15, completeAccurate: 90 }
		});

		const p3 = processBlock.create({
			id: 'p3',
			name: 'Process 2B',
			position: { x: 300, y: 150 },
			metrics: { processTime: 20, completeAccurate: 85 }
		});

		const p4 = processBlock.create({
			id: 'p4',
			name: 'Process 3',
			position: { x: 500, y: 100 },
			metrics: { processTime: 25, completeAccurate: 80 }
		});

		// Create normal path connections
		const c1 = connection.create({
			id: 'c1',
			sourceId: 'p1',
			targetId: 'p2',
			metrics: { waitTime: 5 }
		});

		const c2 = connection.create({
			id: 'c2',
			sourceId: 'p1',
			targetId: 'p3',
			metrics: { waitTime: 7 }
		});

		const c3 = connection.create({
			id: 'c3',
			sourceId: 'p2',
			targetId: 'p4',
			metrics: { waitTime: 10 }
		});

		const c4 = connection.create({
			id: 'c4',
			sourceId: 'p3',
			targetId: 'p4',
			metrics: { waitTime: 12 }
		});

		// Create a rework connection
		const c5 = connection.create({
			id: 'c5',
			sourceId: 'p4',
			targetId: 'p1',
			isRework: true,
			metrics: { waitTime: 15 }
		});

		// Create VSM
		complexVSM = vsmCreator.create({
			id: 'complex',
			title: 'Complex Test VSM',
			processes: [p1, p2, p3, p4],
			connections: [c1, c2, c3, c4, c5]
		});
	});

	describe('Complex Layout Scenarios', () => {
		it('should properly handle parallel process paths', () => {
			// Auto-arrange the VSM
			const arrangedVSM = vsmCreator.autoArrange(complexVSM);

			// Extract arranged process positions
			const p1 = arrangedVSM.processes.find((p) => p.id === 'p1');
			const p2 = arrangedVSM.processes.find((p) => p.id === 'p2');
			const p3 = arrangedVSM.processes.find((p) => p.id === 'p3');
			const p4 = arrangedVSM.processes.find((p) => p.id === 'p4');

			// Verify horizontal flow is maintained (p1 -> p2/p3 -> p4)
			expect(p1.position.x).toBeLessThan(p2.position.x);
			expect(p1.position.x).toBeLessThan(p3.position.x);
			expect(p2.position.x).toBeLessThan(p4.position.x);
			expect(p3.position.x).toBeLessThan(p4.position.x);

			// Verify parallel processes (p2 and p3) are at same level horizontally
			expect(p2.position.x).toBeCloseTo(p3.position.x, 0);

			// Verify vertical separation of parallel processes
			expect(Math.abs(p2.position.y - p3.position.y)).toBeGreaterThan(0);
		});

		it('should maintain proper spacing between processes', () => {
			// Auto-arrange the VSM
			const arrangedVSM = vsmCreator.autoArrange(complexVSM);

			// Extract arranged process positions
			const processes = arrangedVSM.processes;

			// Check horizontal spacing between connected processes
			for (const conn of arrangedVSM.connections) {
				if (!conn.isRework) {
					const source = processes.find((p) => p.id === conn.sourceId);
					const target = processes.find((p) => p.id === conn.targetId);

					// Verify there's adequate spacing between connected processes
					const horizontalSpacing = target.position.x - source.position.x;
					expect(horizontalSpacing).toBeGreaterThanOrEqual(150); // Minimum spacing
				}
			}
		});

		it('should ignore rework connections for basic layout positioning', () => {
			// Auto-arrange the VSM
			const arrangedVSM = vsmCreator.autoArrange(complexVSM);

			// Find the rework connection
			const reworkConn = arrangedVSM.connections.find((c) => c.isRework);
			const source = arrangedVSM.processes.find((p) => p.id === reworkConn.sourceId);
			const target = arrangedVSM.processes.find((p) => p.id === reworkConn.targetId);

			// Despite rework connection going right-to-left, the processes should still
			// be positioned left-to-right in the normal flow
			expect(target.position.x).toBeLessThan(source.position.x);
		});
	});

	describe('Layout algorithm optimizations', () => {
		it('should handle cycles in process dependencies', () => {
			// Create a circular dependency (beyond just the rework connection)
			const circularConn = connection.create({
				id: 'circular',
				sourceId: 'p2',
				targetId: 'p1',
				metrics: { waitTime: 5 }
			});

			// Add the circular connection
			const circularVSM = vsmCreator.addConnection(complexVSM, circularConn);

			// This should not cause infinite loops
			const arrangedVSM = vsmCreator.autoArrange(circularVSM);

			// Verify all processes have positions
			for (const process of arrangedVSM.processes) {
				expect(process.position).toBeDefined();
				expect(process.position.x).toBeGreaterThanOrEqual(0);
				expect(process.position.y).toBeGreaterThanOrEqual(0);
			}
		});

		it('should handle isolated processes', () => {
			// Create an isolated process
			const isolatedProcess = processBlock.create({
				id: 'isolated',
				name: 'Isolated Process',
				position: { x: 700, y: 300 },
				metrics: { processTime: 15 }
			});

			// Add it to the VSM without connections
			const vsmWithIsolated = vsmCreator.addProcess(complexVSM, isolatedProcess);

			// Auto-arrange the VSM
			const arrangedVSM = vsmCreator.autoArrange(vsmWithIsolated);

			// Find the isolated process after arrangement
			const isolatedAfter = arrangedVSM.processes.find((p) => p.id === 'isolated');

			// Verify it has been positioned (not at 0,0)
			expect(isolatedAfter.position.x).toBeGreaterThan(0);
			expect(isolatedAfter.position.y).toBeGreaterThan(0);

			// Isolated processes should be positioned somewhere reasonable
			expect(isolatedAfter.position.x).toBeGreaterThanOrEqual(50);
			expect(isolatedAfter.position.y).toBeGreaterThanOrEqual(50);
		});
	});

	describe('Recommended position calculations', () => {
		it('should recommend positions for new processes that follow visual flow', () => {
			// Find the terminal process
			const p4 = complexVSM.processes.find((p) => p.id === 'p4');

			// Get recommended position for a new process after p4, passing connections
			const recommendedPosition = autoLayout.getRecommendedPosition(
				complexVSM.processes,
				complexVSM.connections
			);

			// Position should be to the right of p4
			expect(recommendedPosition.x).toBeGreaterThan(p4.position.x);

			// Y position should be reasonable (not too far from existing processes)
			const avgY =
				complexVSM.processes.reduce((sum, p) => sum + p.position.y, 0) /
				complexVSM.processes.length;

			expect(Math.abs(recommendedPosition.y - avgY)).toBeLessThan(100);
		});

		it('should provide sensible default positions when no processes exist', () => {
			// Get recommended position with empty array
			const position = autoLayout.getRecommendedPosition([]);

			// Should have reasonable positive values
			expect(position.x).toBeGreaterThanOrEqual(0);
			expect(position.y).toBeGreaterThanOrEqual(0);
		});
	});
});
