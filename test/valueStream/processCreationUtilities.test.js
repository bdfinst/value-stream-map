import { describe, it, expect } from 'vitest';
import processCreationFlow from '../../src/lib/valueStream/processCreationFlow.js';
import connection from '../../src/lib/valueStream/connection.js';
import processBlock from '../../src/lib/valueStream/processBlock.js';

describe('Process Creation Utilities', () => {
	describe('isFirstProcess', () => {
		it('should identify a process with no incoming connections as first', () => {
			// Create test connections
			const connections = [
				connection.create({
					id: 'conn1',
					sourceId: 'process1',
					targetId: 'process2'
				})
			];

			// Process1 has no incoming connections
			expect(processCreationFlow.isFirstProcess('process1', connections)).toBe(true);

			// Process2 has an incoming connection
			expect(processCreationFlow.isFirstProcess('process2', connections)).toBe(false);
		});

		it('should ignore rework connections when identifying first process', () => {
			// Create test connections with a rework connection
			const connections = [
				connection.create({
					id: 'conn1',
					sourceId: 'process1',
					targetId: 'process2'
				}),
				connection.create({
					id: 'conn2',
					sourceId: 'process2',
					targetId: 'process1',
					isRework: true
				})
			];

			// Process1 has an incoming rework connection, but should still be considered first
			expect(processCreationFlow.isFirstProcess('process1', connections)).toBe(true);
		});
	});

	describe('isLastProcess', () => {
		it('should identify a process with no outgoing connections as last', () => {
			// Create test connections
			const connections = [
				connection.create({
					id: 'conn1',
					sourceId: 'process1',
					targetId: 'process2'
				})
			];

			// Process2 has no outgoing connections
			expect(processCreationFlow.isLastProcess('process2', connections)).toBe(true);

			// Process1 has an outgoing connection
			expect(processCreationFlow.isLastProcess('process1', connections)).toBe(false);
		});

		it('should ignore rework connections when identifying last process', () => {
			// Create test connections with a rework connection
			const connections = [
				connection.create({
					id: 'conn1',
					sourceId: 'process1',
					targetId: 'process2'
				}),
				connection.create({
					id: 'conn2',
					sourceId: 'process2',
					targetId: 'process1',
					isRework: true
				})
			];

			// Process2 has an outgoing rework connection but should still be considered last
			expect(processCreationFlow.isLastProcess('process2', connections)).toBe(true);
		});
	});

	describe('findPotentialSourceProcess', () => {
		it('should find the last process in the flow', () => {
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
				})
			];

			// Create connections for linear flow: process1 -> process2 -> process3
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

			// Should identify process3 as the potential source for a new connection
			const result = processCreationFlow.findPotentialSourceProcess(processes, connections);
			expect(result.id).toBe('process3');
		});

		it('should handle branching flows by picking one of the end processes', () => {
			// Create test processes for a branching flow
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
				})
			];

			// Create connections for branching flow: process1 -> process2 and process1 -> process3
			const connections = [
				connection.create({
					id: 'conn1',
					sourceId: 'process1',
					targetId: 'process2'
				}),
				connection.create({
					id: 'conn2',
					sourceId: 'process1',
					targetId: 'process3'
				})
			];

			// Should identify either process2 or process3 as potential sources
			const result = processCreationFlow.findPotentialSourceProcess(processes, connections);

			// Since the implementation returns the first end process found,
			// and the array order can impact which is returned first,
			// we allow either process2 or process3 as valid answers
			expect(['process2', 'process3']).toContain(result.id);
		});

		it('should handle empty processes array', () => {
			const result = processCreationFlow.findPotentialSourceProcess([], []);
			expect(result).toBeNull();
		});
	});
});
