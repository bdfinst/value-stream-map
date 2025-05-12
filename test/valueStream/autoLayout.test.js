import { describe, it, expect } from 'vitest';
import autoLayout from '../../src/lib/valueStream/autoLayout.js';

describe('autoLayout module', () => {
	describe('calculateOptimalPositions', () => {
		it('should position processes in sequence based on connections', () => {
			// Create test processes and connections
			const processes = [
				{ id: 'p1', name: 'Process 1', position: { x: 100, y: 100 }, metrics: {} },
				{ id: 'p2', name: 'Process 2', position: { x: 300, y: 100 }, metrics: {} },
				{ id: 'p3', name: 'Process 3', position: { x: 500, y: 100 }, metrics: {} }
			];

			const connections = [
				{ id: 'c1', sourceId: 'p1', targetId: 'p2', metrics: {} },
				{ id: 'c2', sourceId: 'p2', targetId: 'p3', metrics: {} }
			];

			// Get optimized positions
			const newPositions = autoLayout.calculateOptimalPositions(processes, connections);

			// Expect processes to be arranged in left-to-right sequence
			expect(newPositions['p1'].x).toBeLessThan(newPositions['p2'].x);
			expect(newPositions['p2'].x).toBeLessThan(newPositions['p3'].x);

			// Expect y-positions to be roughly the same (horizontal flow)
			expect(Math.abs(newPositions['p1'].y - newPositions['p2'].y)).toBeLessThan(10);
			expect(Math.abs(newPositions['p2'].y - newPositions['p3'].y)).toBeLessThan(10);
		});

		it('should handle processes with no connections', () => {
			// Create test processes with an isolated one
			const processes = [
				{ id: 'p1', name: 'Process 1', position: { x: 100, y: 100 }, metrics: {} },
				{ id: 'p2', name: 'Process 2', position: { x: 300, y: 100 }, metrics: {} },
				{ id: 'p3', name: 'Isolated', position: { x: 500, y: 300 }, metrics: {} }
			];

			const connections = [{ id: 'c1', sourceId: 'p1', targetId: 'p2', metrics: {} }];

			// Get optimized positions
			const newPositions = autoLayout.calculateOptimalPositions(processes, connections);

			// Expect connected processes to maintain relationship
			expect(newPositions['p1'].x).toBeLessThan(newPositions['p2'].x);

			// Expect isolated process to be positioned separately but still present
			expect(newPositions['p3']).toBeDefined();
		});

		it('should handle rework connections properly', () => {
			// Create test processes with a rework connection
			const processes = [
				{ id: 'p1', name: 'Process 1', position: { x: 100, y: 100 }, metrics: {} },
				{ id: 'p2', name: 'Process 2', position: { x: 300, y: 100 }, metrics: {} },
				{ id: 'p3', name: 'Process 3', position: { x: 500, y: 100 }, metrics: {} }
			];

			const connections = [
				{ id: 'c1', sourceId: 'p1', targetId: 'p2', metrics: {} },
				{ id: 'c2', sourceId: 'p2', targetId: 'p3', metrics: {} },
				{ id: 'c3', sourceId: 'p3', targetId: 'p1', metrics: {}, isRework: true }
			];

			// Get optimized positions
			const newPositions = autoLayout.calculateOptimalPositions(processes, connections);

			// Expect normal flow to be maintained despite rework
			expect(newPositions['p1'].x).toBeLessThan(newPositions['p2'].x);
			expect(newPositions['p2'].x).toBeLessThan(newPositions['p3'].x);
		});
	});

	describe('getRecommendedPosition', () => {
		it('should calculate position for a new process based on existing processes', () => {
			// Create test processes
			const processes = [
				{ id: 'p1', name: 'Process 1', position: { x: 100, y: 100 }, metrics: {} },
				{ id: 'p2', name: 'Process 2', position: { x: 300, y: 100 }, metrics: {} }
			];

			// Get recommended position for new process
			const position = autoLayout.getRecommendedPosition(processes);

			// Expect position to be after the right-most process
			expect(position.x).toBeGreaterThan(300);
			expect(position.y).toBeCloseTo(100, 0);
		});

		it('should return default position if no processes exist', () => {
			// Get recommended position with empty processes array
			const position = autoLayout.getRecommendedPosition([]);

			// Expect some reasonable default position
			expect(position.x).toBeGreaterThanOrEqual(0);
			expect(position.y).toBeGreaterThanOrEqual(0);
		});
	});

	describe('applyLayout', () => {
		it('should apply new positions to processes and return an updated array', () => {
			// Create test processes
			const processes = [
				{ id: 'p1', name: 'Process 1', position: { x: 100, y: 100 }, metrics: {} },
				{ id: 'p2', name: 'Process 2', position: { x: 300, y: 100 }, metrics: {} }
			];

			// Create new positions map
			const newPositions = {
				p1: { x: 200, y: 200 },
				p2: { x: 400, y: 200 }
			};

			// Apply layout changes
			const updatedProcesses = autoLayout.applyLayout(processes, newPositions);

			// Expect processes to have updated positions
			expect(updatedProcesses[0].position.x).toBe(200);
			expect(updatedProcesses[0].position.y).toBe(200);
			expect(updatedProcesses[1].position.x).toBe(400);
			expect(updatedProcesses[1].position.y).toBe(200);

			// Ensure original array was not modified (immutability)
			expect(processes[0].position.x).toBe(100);
			expect(processes[1].position.x).toBe(300);
		});
	});
});
