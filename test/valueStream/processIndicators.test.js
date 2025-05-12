import { describe, it, expect } from 'vitest';
import processIndicators from '../../src/lib/valueStream/processIndicators.js';
import connection from '../../src/lib/valueStream/connection.js';

describe('Process Indicators', () => {
	describe('isFirstProcess', () => {
		it('should identify a process with no incoming connections as first', () => {
			const connections = [
				connection.create({
					id: 'conn1',
					sourceId: 'process1',
					targetId: 'process2'
				})
			];

			// Process1 has no incoming connections
			expect(processIndicators.isFirstProcess('process1', connections)).toBe(true);

			// Process2 has an incoming connection
			expect(processIndicators.isFirstProcess('process2', connections)).toBe(false);
		});

		it('should ignore rework connections when identifying first process', () => {
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
			expect(processIndicators.isFirstProcess('process1', connections)).toBe(true);
		});
	});

	describe('isLastProcess', () => {
		it('should identify a process with no outgoing connections as last', () => {
			const connections = [
				connection.create({
					id: 'conn1',
					sourceId: 'process1',
					targetId: 'process2'
				})
			];

			// Process2 has no outgoing connections
			expect(processIndicators.isLastProcess('process2', connections)).toBe(true);

			// Process1 has an outgoing connection
			expect(processIndicators.isLastProcess('process1', connections)).toBe(false);
		});

		it('should ignore rework connections when identifying last process', () => {
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
			expect(processIndicators.isLastProcess('process2', connections)).toBe(true);
		});
	});

	describe('getProcessFlowStatus', () => {
		it('should correctly identify process flow status', () => {
			// Create a simple flow: process1 -> process2 -> process3
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

			// Process1 should be first but not last
			const process1Status = processIndicators.getProcessFlowStatus('process1', connections);
			expect(process1Status.isFirst).toBe(true);
			expect(process1Status.isLast).toBe(false);

			// Process2 should be neither first nor last
			const process2Status = processIndicators.getProcessFlowStatus('process2', connections);
			expect(process2Status.isFirst).toBe(false);
			expect(process2Status.isLast).toBe(false);

			// Process3 should be last but not first
			const process3Status = processIndicators.getProcessFlowStatus('process3', connections);
			expect(process3Status.isFirst).toBe(false);
			expect(process3Status.isLast).toBe(true);
		});
	});

	describe('getProcessStatusClasses', () => {
		it('should return "process-first" class for first process', () => {
			const connections = [
				connection.create({
					id: 'conn1',
					sourceId: 'process1',
					targetId: 'process2'
				})
			];

			const classes = processIndicators.getProcessStatusClasses('process1', connections);
			expect(classes).toContain('process-first');
			expect(classes).not.toContain('process-last');
		});

		it('should return "process-last" class for last process', () => {
			const connections = [
				connection.create({
					id: 'conn1',
					sourceId: 'process1',
					targetId: 'process2'
				})
			];

			const classes = processIndicators.getProcessStatusClasses('process2', connections);
			expect(classes).toContain('process-last');
			expect(classes).not.toContain('process-first');
		});

		it('should return both classes for a process that is both first and last', () => {
			// No connections means the process is both first and last
			const connections = [];

			const classes = processIndicators.getProcessStatusClasses('process1', connections);
			expect(classes).toContain('process-first');
			expect(classes).toContain('process-last');
		});

		it('should return no flow-related classes for middle processes', () => {
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

			const classes = processIndicators.getProcessStatusClasses('process2', connections);
			expect(classes).not.toContain('process-first');
			expect(classes).not.toContain('process-last');
		});
	});

	describe('getProcessVisualAttributes', () => {
		it('should return special attributes for first process', () => {
			const connections = [
				connection.create({
					id: 'conn1',
					sourceId: 'process1',
					targetId: 'process2'
				})
			];

			const attributes = processIndicators.getProcessVisualAttributes('process1', connections);
			expect(attributes.stroke).toBe('#008000'); // Green border for first process
			expect(attributes.indicator).toBe('first');
		});

		it('should return special attributes for last process', () => {
			const connections = [
				connection.create({
					id: 'conn1',
					sourceId: 'process1',
					targetId: 'process2'
				})
			];

			const attributes = processIndicators.getProcessVisualAttributes('process2', connections);
			expect(attributes.stroke).toBe('#0000ff'); // Blue border for last process
			expect(attributes.indicator).toBe('last');
		});

		it('should return combined attributes for a process that is both first and last', () => {
			// No connections means the process is both first and last
			const connections = [];

			const attributes = processIndicators.getProcessVisualAttributes('process1', connections);
			expect(attributes.stroke).toBe('#800080'); // Purple border for first & last process
			expect(attributes.indicator).toBe('first-last');
		});

		it('should return default attributes for middle processes', () => {
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

			const attributes = processIndicators.getProcessVisualAttributes('process2', connections);
			expect(attributes.stroke).toBe('#333'); // Default border
			expect(attributes.indicator).toBeNull();
		});
	});
});
