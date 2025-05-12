import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initVSMStore } from '../../src/lib/valueStream/vsmStore.js';
import processBlock from '../../src/lib/valueStream/processBlock.js';
import connection from '../../src/lib/valueStream/connection.js';
import processCreationFlow from '../../src/lib/valueStream/processCreationFlow.js';
// Using store directly, not get function

// This test uses the actual implementation, not mocks

describe('Process Creation Flow Implementation', () => {
	let store;
	let callbacks;

	beforeEach(() => {
		// Initialize the store
		store = initVSMStore({
			id: 'test-vsm',
			title: 'Test VSM',
			processes: [],
			connections: []
		});

		// Set up callback mocks
		callbacks = {
			showConnectionModal: vi.fn(),
			setCurrentConnection: vi.fn(),
			setCurrentProcess: vi.fn()
		};
	});

	it('should not prompt for connection when adding the first process', () => {
		// Create and add the first process
		const firstProcess = processBlock.create({
			id: 'process1',
			name: 'First Process',
			position: { x: 100, y: 100 }
		});
		store.addProcess(firstProcess);

		// Call the function with the actual implementation
		const result = processCreationFlow.promptConnectionAfterProcessCreation(
			store,
			firstProcess,
			callbacks
		);

		// No connection prompt should be shown for the first process
		expect(result).toBe(false);
		expect(callbacks.showConnectionModal).not.toHaveBeenCalled();
		expect(callbacks.setCurrentConnection).not.toHaveBeenCalled();
	});

	it('should prompt for connection when adding a second process', () => {
		// Add first process
		const firstProcess = processBlock.create({
			id: 'process1',
			name: 'First Process',
			position: { x: 100, y: 100 }
		});
		store.addProcess(firstProcess);

		// Add second process
		const secondProcess = processBlock.create({
			id: 'process2',
			name: 'Second Process',
			position: { x: 250, y: 100 }
		});
		store.addProcess(secondProcess);

		// Call the function with the actual implementation
		const result = processCreationFlow.promptConnectionAfterProcessCreation(
			store,
			secondProcess,
			callbacks
		);

		// Should prompt for connection
		expect(result).toBe(true);
		expect(callbacks.showConnectionModal).toHaveBeenCalledWith(true);
		expect(callbacks.setCurrentConnection).toHaveBeenCalledTimes(1);

		// Check that the connection is pre-filled correctly
		const connectionArg = callbacks.setCurrentConnection.mock.calls[0][0];
		expect(connectionArg).toBeDefined();
		expect(connectionArg.targetId).toBe(secondProcess.id);
		expect(connectionArg.sourceId).toBe(firstProcess.id);
	});

	it('should suggest connection from the last process in the flow', () => {
		// Create a simple flow with two processes already connected
		const firstProcess = processBlock.create({
			id: 'process1',
			name: 'First Process',
			position: { x: 100, y: 100 }
		});

		const secondProcess = processBlock.create({
			id: 'process2',
			name: 'Second Process',
			position: { x: 250, y: 100 }
		});

		const existingConnection = connection.create({
			id: 'conn1',
			sourceId: firstProcess.id,
			targetId: secondProcess.id,
			metrics: { waitTime: 5 }
		});

		// Add processes and connection to the store
		store.addProcess(firstProcess);
		store.addProcess(secondProcess);
		store.addConnection(existingConnection);

		// Create a new process
		const thirdProcess = processBlock.create({
			id: 'process3',
			name: 'Third Process',
			position: { x: 400, y: 100 }
		});
		store.addProcess(thirdProcess);

		// Call the function
		const result = processCreationFlow.promptConnectionAfterProcessCreation(
			store,
			thirdProcess,
			callbacks
		);

		// Should prompt for connection
		expect(result).toBe(true);
		expect(callbacks.showConnectionModal).toHaveBeenCalledWith(true);

		// The connection should suggest the second process as source (as it's the end of the current flow)
		const connectionArg = callbacks.setCurrentConnection.mock.calls[0][0];
		expect(connectionArg.sourceId).toBe(secondProcess.id);
		expect(connectionArg.targetId).toBe(thirdProcess.id);
	});
});
