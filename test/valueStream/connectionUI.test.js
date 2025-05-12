import { describe, it, expect } from 'vitest';
import connectionUI from '../../src/lib/valueStream/connectionUI.js';
import connection from '../../src/lib/valueStream/connection.js';
import processBlock from '../../src/lib/valueStream/processBlock.js';

describe('Connection UI Utilities', () => {
	// Setup test data to use in multiple tests
	const processes = [
		processBlock.create({
			id: 'process1',
			name: 'Process 1',
			position: { x: 100, y: 100 }
		}),
		processBlock.create({
			id: 'process2',
			name: 'Process 2',
			position: { x: 300, y: 100 }
		}),
		processBlock.create({
			id: 'process3',
			name: 'Process 3',
			position: { x: 500, y: 100 }
		})
	];

	const normalConnection = connection.create({
		id: 'conn1',
		sourceId: 'process1',
		targetId: 'process2',
		metrics: { waitTime: 5 }
	});

	const reworkConnection = connection.create({
		id: 'conn2',
		sourceId: 'process2',
		targetId: 'process1',
		isRework: true,
		metrics: { waitTime: 3 }
	});

	describe('getConnectionTooltip', () => {
		it('should generate a tooltip for normal connections', () => {
			const tooltip = connectionUI.getConnectionTooltip(normalConnection, processes);
			expect(tooltip).toContain('Process 1');
			expect(tooltip).toContain('Process 2');
			expect(tooltip).toContain('Wait Time: 5');
		});

		it('should generate a tooltip for rework connections', () => {
			const tooltip = connectionUI.getConnectionTooltip(reworkConnection, processes);
			expect(tooltip).toContain('Process 2');
			expect(tooltip).toContain('Process 1');
			expect(tooltip).toContain('Rework');
			expect(tooltip).toContain('Wait Time: 3');
		});
	});

	describe('shouldShowTooltip', () => {
		it('should return true for connections with wait time', () => {
			const result = connectionUI.shouldShowTooltip(normalConnection);
			expect(result).toBe(true);
		});

		it('should return true for rework connections', () => {
			const result = connectionUI.shouldShowTooltip(reworkConnection);
			expect(result).toBe(true);
		});

		it('should return false for simple connections with no wait time', () => {
			const simpleConnection = connection.create({
				id: 'conn3',
				sourceId: 'process2',
				targetId: 'process3',
				metrics: { waitTime: 0 }
			});

			const result = connectionUI.shouldShowTooltip(simpleConnection);
			expect(result).toBe(false);
		});
	});

	describe('getConnectionVisualAttributes', () => {
		it('should return normal attributes for standard connections', () => {
			const attrs = connectionUI.getConnectionVisualAttributes(normalConnection, processes);
			expect(attrs.stroke).toBe('#555');
			expect(attrs.strokeWidth).toBe(2);
			expect(attrs.arrowMarker).toBe('arrow');
		});

		it('should return rework attributes for rework connections', () => {
			const attrs = connectionUI.getConnectionVisualAttributes(reworkConnection, processes);
			expect(attrs.stroke).toBe('#e53e3e');
			expect(attrs.arrowMarker).toBe('arrow-red');
		});

		it('should highlight connections with high wait times', () => {
			const longWaitConnection = connection.create({
				id: 'conn4',
				sourceId: 'process1',
				targetId: 'process3',
				metrics: { waitTime: 50 }
			});

			const attrs = connectionUI.getConnectionVisualAttributes(longWaitConnection, processes);
			expect(attrs.strokeWidth).toBeGreaterThan(2);
		});
	});

	describe('getConnectionDescription', () => {
		it('should create a description for normal connections', () => {
			const description = connectionUI.getConnectionDescription(normalConnection, processes);
			expect(description).toBe('Process 1 → Process 2, Wait: 5');
		});

		it('should create a description for rework connections', () => {
			const description = connectionUI.getConnectionDescription(reworkConnection, processes);
			expect(description).toBe('Process 2 → Process 1 (Rework), Wait: 3');
		});

		it('should handle missing processes gracefully', () => {
			const orphanedConnection = connection.create({
				id: 'conn5',
				sourceId: 'missing1',
				targetId: 'missing2'
			});

			const description = connectionUI.getConnectionDescription(orphanedConnection, processes);
			expect(description).toBe('Connection');
		});
	});

	describe('getRecommendedPath', () => {
		it('should provide a standard path for normal connections', () => {
			const path = connectionUI.getRecommendedPath('process1', 'process2', processes, [
				normalConnection
			]);
			expect(path).toBeInstanceOf(Array);
			expect(path.length).toBeGreaterThan(0);

			// Each point should be an array of two numbers [x, y]
			path.forEach((point) => {
				expect(point).toBeInstanceOf(Array);
				expect(point.length).toBe(2);
				expect(typeof point[0]).toBe('number');
				expect(typeof point[1]).toBe('number');
			});
		});

		it('should provide a curved path for rework connections', () => {
			const path = connectionUI.getRecommendedPath('process2', 'process1', processes, [
				normalConnection,
				reworkConnection
			]);

			// Rework connections should have more control points for the curve
			expect(path.length).toBeGreaterThanOrEqual(4);
		});
	});
});
