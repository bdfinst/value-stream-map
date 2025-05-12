import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockVSM } from '../mocks/mockVSM';

// Mock the File System Access API
const mockFileHandle = {
	createWritable: vi.fn().mockResolvedValue({
		write: vi.fn(),
		close: vi.fn()
	}),
	getFile: vi.fn().mockResolvedValue({
		text: vi.fn().mockResolvedValue(JSON.stringify(mockVSM))
	})
};

// Mock the showSaveFilePicker function
window.showSaveFilePicker = vi.fn().mockResolvedValue(mockFileHandle);

// Mock the showOpenFilePicker function
window.showOpenFilePicker = vi.fn().mockResolvedValue([mockFileHandle]);

// Mock localStorage
const localStorageMock = (() => {
	let store = {};
	return {
		getItem: vi.fn((key) => store[key] || null),
		setItem: vi.fn((key, value) => {
			store[key] = value.toString();
		}),
		removeItem: vi.fn((key) => {
			delete store[key];
		}),
		clear: vi.fn(() => {
			store = {};
		})
	};
})();

Object.defineProperty(window, 'localStorage', {
	value: localStorageMock
});

// Import the module under test
import * as filePersistence from '../../src/lib/valueStream/filePersistence.js';

describe('File Persistence Module', () => {
	// No need for dynamic import as we've imported it above

	beforeEach(() => {
		// Reset the mocks before each test
		vi.clearAllMocks();
		localStorageMock.clear();
	});

	// Tests for saving VSM to local file system
	describe('Save VSM to Local File System', () => {
		it('should save VSM to a new file', async () => {
			await filePersistence.saveVSM(mockVSM);

			expect(window.showSaveFilePicker).toHaveBeenCalled();
			expect(mockFileHandle.createWritable).toHaveBeenCalled();
		});

		it('should save VSM with a custom file name', async () => {
			await filePersistence.saveVSMAs(mockVSM, 'my-value-stream');

			expect(window.showSaveFilePicker).toHaveBeenCalledWith(
				expect.objectContaining({
					suggestedName: 'my-value-stream.vsm.json'
				})
			);
		});

		it('should overwrite existing VSM file if file handle is provided', async () => {
			await filePersistence.saveVSM(mockVSM, mockFileHandle);

			expect(window.showSaveFilePicker).not.toHaveBeenCalled();
			expect(mockFileHandle.createWritable).toHaveBeenCalled();
		});
	});

	// Tests for loading VSM from local file system
	describe('Load VSM from Local File System', () => {
		it('should load VSM from file', async () => {
			const result = await filePersistence.loadVSM();

			expect(window.showOpenFilePicker).toHaveBeenCalled();
			expect(mockFileHandle.getFile).toHaveBeenCalled();
			expect(result).toEqual(mockVSM);
		});

		it('should handle invalid VSM file', async () => {
			// Set up a mock for an invalid file
			const invalidFileHandle = {
				getFile: vi.fn().mockResolvedValue({
					text: vi.fn().mockResolvedValue('{ "invalid": "json" }')
				})
			};

			window.showOpenFilePicker = vi.fn().mockResolvedValue([invalidFileHandle]);

			const loadPromise = filePersistence.loadVSM();

			await expect(loadPromise).rejects.toThrow();
		});
	});

	// Tests for auto-save VSM changes
	describe('Auto-save VSM Changes', () => {
		it('should auto-save VSM to previously used file', async () => {
			await filePersistence.saveVSM(mockVSM); // First save to establish file handle

			// Make the VSM "different" from the last saved one to trigger auto-save
			const modifiedVSM = {
				...mockVSM,
				title: 'Modified VSM Title'
			};

			vi.clearAllMocks(); // Clear mocks to track only the auto-save call
			await filePersistence.autoSaveVSM(modifiedVSM); // Then auto-save with changes

			expect(mockFileHandle.createWritable).toHaveBeenCalled();
		});

		it('should store auto-save status', async () => {
			await filePersistence.saveVSM(mockVSM);

			// Get auto-save status directly
			const status = filePersistence.getAutoSaveStatus();

			expect(status.lastSaved).toBeDefined();
			expect(status.isEnabled).toBe(true);
		});
	});

	// Tests for VSM file management
	describe('VSM File Management', () => {
		it('should maintain a list of recently used files', async () => {
			await filePersistence.saveVSM(mockVSM);
			const recentFiles = filePersistence.getRecentFiles();

			expect(recentFiles.length).toBeGreaterThan(0);
			expect(recentFiles[0].title).toBe(mockVSM.title);
		});

		it('should detect changes between saved and current state', () => {
			filePersistence.setLastSavedVSM(mockVSM);
			const modifiedVSM = { ...mockVSM, title: 'Modified Title' };
			const hasChanges = filePersistence.hasUnsavedChanges(modifiedVSM);

			expect(hasChanges).toBe(true);
		});
	});

	// Tests for fallback mechanisms
	describe('Fallback for browsers without File System Access API', () => {
		beforeEach(() => {
			// Simulate a browser without File System Access API
			delete window.showSaveFilePicker;
			delete window.showOpenFilePicker;

			// Set up document.body to append the link element
			document.body = document.createElement('body');
			document.body.appendChild = vi.fn();
			document.body.removeChild = vi.fn();

			// Mock URL.createObjectURL
			window.URL = {
				createObjectURL: vi.fn().mockReturnValue('mock-object-url'),
				revokeObjectURL: vi.fn()
			};

			// Mock Blob constructor
			window.Blob = function (content, options) {
				return { content, options };
			};
		});

		afterEach(() => {
			// Restore the mocks
			window.showSaveFilePicker = vi.fn().mockResolvedValue(mockFileHandle);
			window.showOpenFilePicker = vi.fn().mockResolvedValue([mockFileHandle]);
		});

		it('should use download/upload fallback when File System Access API is not available', async () => {
			// Create a mock for the download link and click event
			const mockCreateElement = vi.spyOn(document, 'createElement');
			const mockLink = {
				setAttribute: vi.fn(),
				style: {},
				click: vi.fn(),
				remove: vi.fn()
			};
			mockCreateElement.mockReturnValue(mockLink);

			await filePersistence.saveVSM(mockVSM);

			expect(mockCreateElement).toHaveBeenCalledWith('a');
			expect(mockLink.setAttribute).toHaveBeenCalledWith('href', expect.any(String));
			expect(mockLink.click).toHaveBeenCalled();
		});
	});
});
