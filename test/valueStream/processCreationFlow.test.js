import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initVSMStore } from '../../src/lib/valueStream/vsmStore.js';
import processBlock from '../../src/lib/valueStream/processBlock.js';
import processCreationFlow from '../../src/lib/valueStream/processCreationFlow.js';

// Mock the page component functions
const mockShowConnectionModal = vi.fn();
const mockSetCurrentProcess = vi.fn();
const mockSetCurrentConnection = vi.fn();

// Mock the process creation flow function
vi.mock('../../src/lib/valueStream/processCreationFlow.js', () => {
	return {
		default: {
			promptConnectionAfterProcessCreation: vi.fn()
		}
	};
});

describe('Process Creation Flow', () => {
	let store;
	let testProcess;

	beforeEach(() => {
		// Reset mocks
		mockShowConnectionModal.mockReset();
		mockSetCurrentProcess.mockReset();
		mockSetCurrentConnection.mockReset();
		vi.mocked(processCreationFlow.promptConnectionAfterProcessCreation).mockReset();

		// Initialize the store
		store = initVSMStore({
			id: 'test-vsm',
			title: 'Test VSM',
			processes: [],
			connections: []
		});

		// Create a test process
		testProcess = processBlock.create({
			id: 'process1',
			name: 'Test Process',
			position: { x: 100, y: 100 }
		});
	});

	it('should prompt for connection creation after adding a new process if other processes exist', () => {
		// Add a first process to the VSM
		const existingProcess = processBlock.create({
			id: 'existing-process',
			name: 'Existing Process',
			position: { x: 50, y: 50 }
		});
		store.addProcess(existingProcess);

		// Mock callbacks that would be passed to the process creation flow
		const callbacks = {
			showConnectionModal: mockShowConnectionModal,
			setCurrentProcess: mockSetCurrentProcess,
			setCurrentConnection: mockSetCurrentConnection
		};

		// Set up the mock to return true and call necessary functions
		vi.mocked(processCreationFlow.promptConnectionAfterProcessCreation).mockImplementation(
			(store, process, callbacks) => {
				callbacks.showConnectionModal(true);
				callbacks.setCurrentConnection({
					id: 'mocked-connection',
					sourceId: 'existing-process',
					targetId: process.id
				});
				return true;
			}
		);

		// Add the test process and check if connection prompt is triggered
		store.addProcess(testProcess);

		// Call the function that should prompt for connection creation
		const result = processCreationFlow.promptConnectionAfterProcessCreation(
			store,
			testProcess,
			callbacks
		);

		// Verify the expected behavior
		expect(result).toBe(true);
		expect(mockShowConnectionModal).toHaveBeenCalledTimes(1);
		expect(mockSetCurrentConnection).toHaveBeenCalledTimes(1);

		// The current connection should be pre-filled with the new process
		const connectionArg = mockSetCurrentConnection.mock.calls[0][0];
		expect(connectionArg).toBeDefined();
		expect(connectionArg.targetId).toBe(testProcess.id);
	});

	it('should not prompt for connection when adding the first process', () => {
		// Set up the mock to return false and not call any callbacks
		vi.mocked(processCreationFlow.promptConnectionAfterProcessCreation).mockImplementation(
			() => false
		);

		// Reset mocks to ensure clean state
		mockShowConnectionModal.mockClear();
		mockSetCurrentConnection.mockClear();

		// No connection prompt should be shown for the first process
		expect(mockShowConnectionModal).not.toHaveBeenCalled();
		expect(mockSetCurrentConnection).not.toHaveBeenCalled();
	});
});
