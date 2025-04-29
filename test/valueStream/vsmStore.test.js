import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initVSMStore } from '../../src/lib/valueStream/vsmStore.js';
import processBlock from '../../src/lib/valueStream/processBlock.js';

describe('vsmStore', () => {
	let store;

	beforeEach(() => {
		// Mock subscription function to test store updates
		const mockSubscribe = vi.fn();
		vi.stubGlobal('setInterval', vi.fn());
		vi.stubGlobal('clearInterval', vi.fn());

		// Initialize the store for each test
		store = initVSMStore({
			id: 'test-vsm',
			title: 'Test VSM',
			processes: [],
			connections: []
		});

		// Mock subscribe to capture updates
		store.subscribe(mockSubscribe);
	});

	describe('addProcess', () => {
		it('adds a process to the VSM', () => {
			// Initial state should have no processes
			let storeValue;
			const unsubscribe = store.subscribe((value) => {
				storeValue = value;
			});

			expect(storeValue.vsm.processes).toHaveLength(0);

			// Create a test process
			const testProcess = processBlock.create({
				id: 'process1',
				name: 'Test Process'
			});

			// Add the process to the store
			store.addProcess(testProcess);

			// Check that the process was added
			expect(storeValue.vsm.processes).toHaveLength(1);
			expect(storeValue.vsm.processes[0].id).toBe('process1');
			expect(storeValue.vsm.processes[0].name).toBe('Test Process');

			unsubscribe();
		});
	});
});
