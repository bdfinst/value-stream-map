import { describe, it, expect } from 'vitest';
import { connection, processBlock } from '../../src/lib/valueStream';
import vsmCreator from '../../src/lib/valueStream/createVSM.js';
import autoLayout from '../../src/lib/valueStream/autoLayout.js';

describe('Auto Layout Implementation', () => {
	// Sample VSM for testing
	function createTestVSM() {
		// Create test processes
		const p1 = processBlock.create({
			id: 'p1',
			name: 'Process 1',
			position: { x: 300, y: 200 },
			metrics: { processTime: 10, completeAccurate: 95 }
		});

		const p2 = processBlock.create({
			id: 'p2',
			name: 'Process 2',
			position: { x: 100, y: 100 },
			metrics: { processTime: 20, completeAccurate: 90 }
		});

		const p3 = processBlock.create({
			id: 'p3',
			name: 'Process 3',
			position: { x: 500, y: 300 },
			metrics: { processTime: 30, completeAccurate: 85 }
		});

		// Create connections
		const c1 = connection.create({
			id: 'c1',
			sourceId: 'p1',
			targetId: 'p2',
			metrics: { waitTime: 5 }
		});

		const c2 = connection.create({
			id: 'c2',
			sourceId: 'p2',
			targetId: 'p3',
			metrics: { waitTime: 10 }
		});

		// Create VSM
		return vsmCreator.create({
			id: 'test',
			title: 'Test VSM',
			processes: [p1, p2, p3],
			connections: [c1, c2]
		});
	}

	describe('vsmCreator.autoArrange', () => {
		it('should rearrange processes in a logical flow', () => {
			// Create a test VSM
			const testVSM = createTestVSM();

			// Auto-arrange the VSM
			const arrangedVSM = vsmCreator.autoArrange(testVSM);

			// Expect processes are arranged
			// Find processes by ID in the arranged VSM
			const p1 = arrangedVSM.processes.find((p) => p.id === 'p1');
			const p2 = arrangedVSM.processes.find((p) => p.id === 'p2');
			const p3 = arrangedVSM.processes.find((p) => p.id === 'p3');

			// Verify that processes have defined positions
			expect(p1).toBeDefined();
			expect(p1.position).toBeDefined();
			expect(p2).toBeDefined();
			expect(p2.position).toBeDefined();
			expect(p3).toBeDefined();
			expect(p3.position).toBeDefined();

			// Positions should be different from original
			const originalP1 = testVSM.processes.find((p) => p.id === 'p1');
			const originalP2 = testVSM.processes.find((p) => p.id === 'p2');

			// At least one process should be moved to a different position
			const positionsChanged =
				p1.position.x !== originalP1.position.x ||
				p1.position.y !== originalP1.position.y ||
				p2.position.x !== originalP2.position.x ||
				p2.position.y !== originalP2.position.y;

			expect(positionsChanged).toBe(true);
		});

		it('should handle rework connections properly', () => {
			// Create test VSM
			const testVSM = createTestVSM();

			// Add a rework connection
			const reworkConn = connection.create({
				id: 'c3',
				sourceId: 'p3',
				targetId: 'p1',
				isRework: true,
				metrics: { waitTime: 5 }
			});

			const updatedVSM = vsmCreator.addConnection(testVSM, reworkConn);

			// Auto-arrange with rework connection
			const arrangedVSM = vsmCreator.autoArrange(updatedVSM);

			// Find processes
			const p1 = arrangedVSM.processes.find((p) => p.id === 'p1');
			const p2 = arrangedVSM.processes.find((p) => p.id === 'p2');
			const p3 = arrangedVSM.processes.find((p) => p.id === 'p3');

			// Verify that processes have defined positions
			expect(p1).toBeDefined();
			expect(p1.position).toBeDefined();
			expect(p2).toBeDefined();
			expect(p2.position).toBeDefined();
			expect(p3).toBeDefined();
			expect(p3.position).toBeDefined();

			// All processes should be laid out
			expect(p1.position.x).toBeGreaterThanOrEqual(0);
			expect(p2.position.x).toBeGreaterThanOrEqual(0);
			expect(p3.position.x).toBeGreaterThanOrEqual(0);
		});
	});

	describe('autoLayout integration', () => {
		it('should create optimal positions for processes', () => {
			// Create test processes with arbitrary positions
			const processes = [
				processBlock.create({
					id: 'p1',
					name: 'Process 1',
					position: { x: 300, y: 200 }
				}),
				processBlock.create({
					id: 'p2',
					name: 'Process 2',
					position: { x: 100, y: 100 }
				}),
				processBlock.create({
					id: 'p3',
					name: 'Process 3',
					position: { x: 200, y: 300 }
				})
			];

			// Create connections that define a specific flow: p1 -> p2 -> p3
			const connections = [
				connection.create({ id: 'c1', sourceId: 'p1', targetId: 'p2' }),
				connection.create({ id: 'c2', sourceId: 'p2', targetId: 'p3' })
			];

			// Calculate optimal positions
			const positions = autoLayout.calculateOptimalPositions(processes, connections);

			// Positions should maintain the correct order
			expect(positions.p1.x).toBeLessThan(positions.p2.x);
			expect(positions.p2.x).toBeLessThan(positions.p3.x);

			// Apply the layout
			const updatedProcesses = autoLayout.applyLayout(processes, positions);

			// Check that the updated processes have the right positions
			const p1 = updatedProcesses.find((p) => p.id === 'p1');
			const p2 = updatedProcesses.find((p) => p.id === 'p2');
			const p3 = updatedProcesses.find((p) => p.id === 'p3');

			expect(p1.position.x).toBeLessThan(p2.position.x);
			expect(p2.position.x).toBeLessThan(p3.position.x);
		});
	});
});
