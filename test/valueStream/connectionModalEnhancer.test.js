import { describe, it, expect } from 'vitest';
import connectionModalEnhancer from '../../src/lib/valueStream/connectionModalEnhancer.js';
import processBlock from '../../src/lib/valueStream/processBlock.js';
import connection from '../../src/lib/valueStream/connection.js';

describe('Connection Modal Enhancer', () => {
	describe('isNewProcess', () => {
		it('should identify a process that has no connections as new', () => {
			// Setup test data with some connections between processes
			const connections = [
				connection.create({
					id: 'conn1',
					sourceId: 'process1',
					targetId: 'process2'
				}),
				connection.create({
					id: 'conn2',
					sourceId: 'process2',
					targetId: 'process3'
				})
			];

			// Process4 is not connected to any other process
			expect(connectionModalEnhancer.isNewProcess('process4', connections)).toBe(true);

			// Process1 is connected as a source
			expect(connectionModalEnhancer.isNewProcess('process1', connections)).toBe(false);

			// Process2 is connected as both source and target
			expect(connectionModalEnhancer.isNewProcess('process2', connections)).toBe(false);

			// Process3 is connected as a target
			expect(connectionModalEnhancer.isNewProcess('process3', connections)).toBe(false);
		});
	});

	describe('getSuggestedProcessToConnect', () => {
		it('should suggest the last process as the source for a new process', () => {
			// Create test processes
			const processes = [
				processBlock.create({
					id: 'process1',
					name: 'Process 1'
				}),
				processBlock.create({
					id: 'process2',
					name: 'Process 2'
				}),
				processBlock.create({
					id: 'process3',
					name: 'Process 3'
				}),
				processBlock.create({
					id: 'process4',
					name: 'New Process'
				})
			];

			// Create connections for a linear flow: process1 -> process2 -> process3
			const connections = [
				connection.create({
					id: 'conn1',
					sourceId: 'process1',
					targetId: 'process2'
				}),
				connection.create({
					id: 'conn2',
					sourceId: 'process2',
					targetId: 'process3'
				})
			];

			// The function should suggest process3 (the last in the chain) as the source
			// for the new process4
			const suggested = connectionModalEnhancer.getSuggestedProcessToConnect(
				processes,
				connections,
				'process4'
			);

			expect(suggested).not.toBeNull();
			expect(suggested.id).toBe('process3');
		});

		it('should not suggest any process when there are no other processes', () => {
			// Only one process, the new one
			const processes = [
				processBlock.create({
					id: 'process1',
					name: 'First Process'
				})
			];

			const connections = [];

			const suggested = connectionModalEnhancer.getSuggestedProcessToConnect(
				processes,
				connections,
				'process1'
			);

			expect(suggested).toBeNull();
		});
	});

	describe('preSelectConnectionValues', () => {
		it('should pre-fill a connection with the new process as target and suggested process as source', () => {
			// Create test processes
			const processes = [
				processBlock.create({
					id: 'process1',
					name: 'Process 1'
				}),
				processBlock.create({
					id: 'process2',
					name: 'Process 2'
				}),
				processBlock.create({
					id: 'process3',
					name: 'New Process'
				})
			];

			// Create connections for a linear flow: process1 -> process2
			const connections = [
				connection.create({
					id: 'conn1',
					sourceId: 'process1',
					targetId: 'process2'
				})
			];

			// Empty connection to be pre-filled
			const emptyConnection = connection.create({
				id: 'new-conn',
				sourceId: '',
				targetId: ''
			});

			// The function should pre-fill with process2 as source and process3 as target
			const preFilled = connectionModalEnhancer.preSelectConnectionValues(
				emptyConnection,
				processes,
				connections,
				'process3'
			);

			expect(preFilled.sourceId).toBe('process2');
			expect(preFilled.targetId).toBe('process3');
			expect(preFilled.metrics.waitTime).toBe(0);
		});

		it('should keep source empty when there are no other processes', () => {
			// Only one process, the new one
			const processes = [
				processBlock.create({
					id: 'process1',
					name: 'First Process'
				})
			];

			const connections = [];

			// Empty connection to be pre-filled
			const emptyConnection = connection.create({
				id: 'new-conn',
				sourceId: '',
				targetId: ''
			});

			// The function should leave sourceId empty but set targetId to the new process
			const preFilled = connectionModalEnhancer.preSelectConnectionValues(
				emptyConnection,
				processes,
				connections,
				'process1'
			);

			expect(preFilled.sourceId).toBe('');
			expect(preFilled.targetId).toBe('process1');
		});

		it('should respect existing values in the connection', () => {
			// Create test processes
			const processes = [
				processBlock.create({
					id: 'process1',
					name: 'Process 1'
				}),
				processBlock.create({
					id: 'process2',
					name: 'Process 2'
				}),
				processBlock.create({
					id: 'process3',
					name: 'New Process'
				})
			];

			// Create connections
			const connections = [
				connection.create({
					id: 'conn1',
					sourceId: 'process1',
					targetId: 'process2'
				})
			];

			// Connection with existing values
			const existingConnection = connection.create({
				id: 'existing-conn',
				sourceId: 'process1',
				targetId: 'process3',
				metrics: { waitTime: 10 },
				isRework: true
			});

			// The function should preserve the existing values
			const updated = connectionModalEnhancer.preSelectConnectionValues(
				existingConnection,
				processes,
				connections,
				'process3'
			);

			expect(updated.sourceId).toBe('process1'); // Preserved
			expect(updated.targetId).toBe('process3'); // Preserved
			expect(updated.metrics.waitTime).toBe(10); // Preserved
			expect(updated.isRework).toBe(true); // Preserved
		});
	});
});
