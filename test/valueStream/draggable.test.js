import { describe, it, expect } from 'vitest';
import { applyDragToProcess } from '../../src/lib/valueStream/draggable.js';
import processBlock from '../../src/lib/valueStream/processBlock.js';

describe('draggable', () => {
	describe('applyDragToProcess', () => {
		it('updates process position based on drag delta', () => {
			// Create a test process
			const testProcess = processBlock.create({
				id: 'process1',
				name: 'Test Process',
				position: { x: 100, y: 200 }
			});

			// Apply a drag operation
			const updatedProcess = applyDragToProcess(testProcess, { dx: 50, dy: -30 });

			// The position should be updated by the delta
			expect(updatedProcess.position).toEqual({ x: 150, y: 170 });

			// The process should be a new instance (immutability)
			expect(updatedProcess).not.toBe(testProcess);

			// Other properties should remain unchanged
			expect(updatedProcess.id).toBe(testProcess.id);
			expect(updatedProcess.name).toBe(testProcess.name);
		});
	});
});
