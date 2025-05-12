/**
 * File persistence module for Value Stream Maps
 * Handles saving, loading, and auto-saving VSM data to local files
 */

// Constants for local storage keys
const STORAGE_KEYS = {
	RECENT_FILES: 'vsm-recent-files',
	AUTO_SAVE_STATUS: 'vsm-auto-save-status',
	LAST_SAVED_VSM: 'vsm-last-saved',
	FILE_FORMAT_VERSION: 'vsm-file-format-version'
};

// Current file format version
const CURRENT_VERSION = '1.0.0';

// Maximum number of recent files to track
const MAX_RECENT_FILES = 10;

// State variables
let currentFileHandle = null; // Holds reference to the current file handle
let lastSavedVSM = null; // Holds the last saved VSM for change detection
let autoSaveEnabled = true; // Auto-save enabled by default
let lastSavedTime = null; // Timestamp of last save

/**
 * Checks if the File System Access API is available
 * @returns {boolean} True if the API is available
 */
export function isFileSystemAccessSupported() {
	return 'showSaveFilePicker' in window && 'showOpenFilePicker' in window;
}

/**
 * Serializes VSM to JSON format including version information
 * @param {import('./createVSM').ValueStreamMap} vsm - The VSM to serialize
 * @returns {string} Serialized VSM as JSON string
 */
export function serializeVSM(vsm) {
	const fileData = {
		version: CURRENT_VERSION,
		data: vsm
	};
	return JSON.stringify(fileData, null, 2); // Pretty print with 2 spaces
}

/**
 * Deserializes VSM from JSON format
 * @param {string} jsonString - JSON string to deserialize
 * @returns {import('./createVSM').ValueStreamMap} The deserialized VSM
 * @throws {Error} If the JSON is invalid or incompatible
 */
export function deserializeVSM(jsonString) {
	try {
		const parsed = JSON.parse(jsonString);

		// Handle direct VSM data (no version wrapper)
		if (parsed.id && parsed.processes && parsed.connections) {
			return parsed;
		}

		// Handle versioned format
		if (parsed.version && parsed.data) {
			const { version, data } = parsed;

			// Check version compatibility
			if (compareVersions(version, CURRENT_VERSION) > 0) {
				console.warn(
					`Loading VSM from newer version (${version}). Some features may not work correctly.`
				);
			}

			return data;
		}

		throw new Error('Invalid VSM file format');
	} catch (error) {
		throw new Error(`Failed to parse VSM file: ${error.message}`);
	}
}

/**
 * Compares two version strings
 * @param {string} versionA - First version
 * @param {string} versionB - Second version
 * @returns {number} -1 if A < B, 0 if A = B, 1 if A > B
 */
function compareVersions(versionA, versionB) {
	const partsA = versionA.split('.').map(Number);
	const partsB = versionB.split('.').map(Number);

	for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
		const a = partsA[i] || 0;
		const b = partsB[i] || 0;

		if (a > b) return 1;
		if (a < b) return -1;
	}

	return 0;
}

/**
 * Saves VSM to a local file using File System Access API
 * @param {import('./createVSM').ValueStreamMap} vsm - The VSM to save
 * @param {FileSystemFileHandle} [fileHandle] - Existing file handle to overwrite (optional)
 * @returns {Promise<FileSystemFileHandle>} Handle to the saved file
 * @throws {Error} If the save operation fails
 */
export async function saveVSM(vsm, fileHandle = null) {
	try {
		// If we have a file handle, use it (overwrite)
		if (fileHandle) {
			currentFileHandle = fileHandle;
		}
		// Otherwise, show the save dialog
		else if (isFileSystemAccessSupported()) {
			const options = {
				types: [
					{
						description: 'Value Stream Map',
						accept: {
							'application/json': ['.vsm.json']
						}
					}
				],
				suggestedName: `${vsm.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.vsm.json`
			};

			currentFileHandle = await window.showSaveFilePicker(options);
		}
		// Fallback for browsers without File System Access API
		else {
			return await fallbackSaveVSM(vsm);
		}

		// Get a writable stream to the file
		const writable = await currentFileHandle.createWritable();

		// Serialize the VSM and write it to the file
		const serialized = serializeVSM(vsm);
		await writable.write(serialized);
		await writable.close();

		// Update last saved information
		lastSavedVSM = JSON.parse(JSON.stringify(vsm)); // Deep clone
		lastSavedTime = new Date();

		// Add to recent files
		addToRecentFiles({
			title: vsm.title,
			id: vsm.id,
			timestamp: lastSavedTime.getTime()
		});

		// Update auto-save status
		updateAutoSaveStatus();

		return currentFileHandle;
	} catch (error) {
		console.error('Error saving VSM:', error);
		throw new Error(`Failed to save VSM: ${error.message}`);
	}
}

/**
 * Saves VSM with a custom filename
 * @param {import('./createVSM').ValueStreamMap} vsm - The VSM to save
 * @param {string} filename - The filename to use (without extension)
 * @returns {Promise<FileSystemFileHandle>} Handle to the saved file
 */
export async function saveVSMAs(vsm, filename) {
	// Force a new file save dialog
	currentFileHandle = null;

	if (isFileSystemAccessSupported()) {
		const options = {
			types: [
				{
					description: 'Value Stream Map',
					accept: {
						'application/json': ['.vsm.json']
					}
				}
			],
			suggestedName: `${filename}.vsm.json`
		};

		currentFileHandle = await window.showSaveFilePicker(options);
		return saveVSM(vsm, currentFileHandle);
	} else {
		return await fallbackSaveVSM(vsm, `${filename}.vsm.json`);
	}
}

/**
 * Fallback save function for browsers without File System Access API
 * @param {import('./createVSM').ValueStreamMap} vsm - The VSM to save
 * @param {string} [filename] - Optional filename to suggest
 * @returns {Promise<null>} No file handle in fallback mode
 */
async function fallbackSaveVSM(vsm, filename = null) {
	// Create a data URL from the serialized VSM
	const serialized = serializeVSM(vsm);
	const blob = new Blob([serialized], { type: 'application/json' });
	const url = URL.createObjectURL(blob);

	// Create a temporary download link
	const link = document.createElement('a');
	link.setAttribute('href', url);
	link.setAttribute(
		'download',
		filename || `${vsm.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.vsm.json`
	);
	link.style.display = 'none';

	// Add the link to the document, click it, and remove it
	document.body.appendChild(link);
	link.click();

	// Clean up
	setTimeout(() => {
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}, 100);

	// Update last saved information
	lastSavedVSM = JSON.parse(JSON.stringify(vsm)); // Deep clone
	lastSavedTime = new Date();

	// Add to recent files
	addToRecentFiles({
		title: vsm.title,
		id: vsm.id,
		timestamp: lastSavedTime.getTime()
	});

	// Update auto-save status
	updateAutoSaveStatus();

	// No file handle in fallback mode
	return null;
}

/**
 * Loads VSM from a local file
 * @returns {Promise<import('./createVSM').ValueStreamMap>} The loaded VSM
 * @throws {Error} If the load operation fails
 */
export async function loadVSM() {
	try {
		if (isFileSystemAccessSupported()) {
			// Show file picker to select a VSM file
			const options = {
				types: [
					{
						description: 'Value Stream Map',
						accept: {
							'application/json': ['.vsm.json', '.json']
						}
					}
				],
				multiple: false
			};

			const [fileHandle] = await window.showOpenFilePicker(options);
			currentFileHandle = fileHandle;

			// Get the file and read its contents
			const file = await fileHandle.getFile();
			const contents = await file.text();

			// Deserialize the VSM
			const vsm = deserializeVSM(contents);

			// Update last saved information
			lastSavedVSM = JSON.parse(JSON.stringify(vsm)); // Deep clone
			lastSavedTime = new Date();

			// Add to recent files
			addToRecentFiles({
				title: vsm.title,
				id: vsm.id,
				timestamp: lastSavedTime.getTime()
			});

			return vsm;
		} else {
			// Fallback for browsers without File System Access API
			return await fallbackLoadVSM();
		}
	} catch (error) {
		console.error('Error loading VSM:', error);
		throw new Error(`Failed to load VSM: ${error.message}`);
	}
}

/**
 * Fallback load function for browsers without File System Access API
 * @returns {Promise<import('./createVSM').ValueStreamMap>} The loaded VSM
 * @throws {Error} If the load operation fails
 */
async function fallbackLoadVSM() {
	return new Promise((resolve, reject) => {
		// Create a temporary file input element
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.vsm.json,.json';
		input.style.display = 'none';

		// Handle file selection
		input.onchange = async (event) => {
			try {
				const file = event.target.files[0];
				if (!file) {
					reject(new Error('No file selected'));
					return;
				}

				// Read the file contents
				const reader = new FileReader();
				reader.onload = (e) => {
					try {
						// Deserialize the VSM
						const vsm = deserializeVSM(e.target.result);

						// Update last saved information
						lastSavedVSM = JSON.parse(JSON.stringify(vsm)); // Deep clone
						lastSavedTime = new Date();

						// Add to recent files
						addToRecentFiles({
							title: vsm.title,
							id: vsm.id,
							timestamp: lastSavedTime.getTime()
						});

						resolve(vsm);
					} catch (error) {
						reject(error);
					}
				};
				reader.onerror = () => reject(new Error('Failed to read file'));
				reader.readAsText(file);
			} finally {
				// Clean up
				document.body.removeChild(input);
			}
		};

		// Add the input to the document and click it
		document.body.appendChild(input);
		input.click();
	});
}

/**
 * Auto-saves VSM to the current file handle
 * @param {import('./createVSM').ValueStreamMap} vsm - The VSM to save
 * @returns {Promise<boolean>} True if save was successful
 */
export async function autoSaveVSM(vsm) {
	// Skip if auto-save is disabled or we don't have a file handle
	if (!autoSaveEnabled || (!currentFileHandle && !isFileSystemAccessSupported())) {
		return false;
	}

	try {
		// Only auto-save if there are unsaved changes
		if (hasUnsavedChanges(vsm)) {
			await saveVSM(vsm, currentFileHandle);
			return true;
		}
		return false;
	} catch (error) {
		console.error('Auto-save failed:', error);
		return false;
	}
}

/**
 * Adds file information to the recent files list
 * @param {Object} fileInfo - Information about the file
 * @param {string} fileInfo.title - VSM title
 * @param {string} fileInfo.id - VSM ID
 * @param {number} fileInfo.timestamp - Save timestamp
 */
function addToRecentFiles(fileInfo) {
	try {
		// Get existing recent files
		const recentFilesJson = localStorage.getItem(STORAGE_KEYS.RECENT_FILES) || '[]';
		const recentFiles = JSON.parse(recentFilesJson);

		// Remove any existing entry with the same ID
		const filteredFiles = recentFiles.filter((file) => file.id !== fileInfo.id);

		// Add the new file info to the beginning
		filteredFiles.unshift(fileInfo);

		// Limit to MAX_RECENT_FILES
		const limitedFiles = filteredFiles.slice(0, MAX_RECENT_FILES);

		// Save back to local storage
		localStorage.setItem(STORAGE_KEYS.RECENT_FILES, JSON.stringify(limitedFiles));
	} catch (error) {
		console.error('Error updating recent files:', error);
	}
}

/**
 * Gets the list of recently used files
 * @returns {Array<Object>} List of recent files
 */
export function getRecentFiles() {
	try {
		const recentFilesJson = localStorage.getItem(STORAGE_KEYS.RECENT_FILES) || '[]';
		return JSON.parse(recentFilesJson);
	} catch (error) {
		console.error('Error getting recent files:', error);
		return [];
	}
}

/**
 * Updates the auto-save status in local storage
 */
function updateAutoSaveStatus() {
	try {
		const status = {
			isEnabled: autoSaveEnabled,
			lastSaved: lastSavedTime ? lastSavedTime.getTime() : null
		};
		localStorage.setItem(STORAGE_KEYS.AUTO_SAVE_STATUS, JSON.stringify(status));
	} catch (error) {
		console.error('Error updating auto-save status:', error);
	}
}

/**
 * Gets the current auto-save status
 * @returns {Object} Auto-save status information
 */
export function getAutoSaveStatus() {
	try {
		const statusJson = localStorage.getItem(STORAGE_KEYS.AUTO_SAVE_STATUS);
		if (statusJson) {
			const status = JSON.parse(statusJson);
			return {
				isEnabled: status.isEnabled,
				lastSaved: status.lastSaved ? new Date(status.lastSaved) : null
			};
		}
		return {
			isEnabled: autoSaveEnabled,
			lastSaved: lastSavedTime
		};
	} catch (error) {
		console.error('Error getting auto-save status:', error);
		return {
			isEnabled: autoSaveEnabled,
			lastSaved: lastSavedTime
		};
	}
}

/**
 * Enables or disables auto-save
 * @param {boolean} enabled - Whether auto-save should be enabled
 */
export function setAutoSaveEnabled(enabled) {
	autoSaveEnabled = enabled;
	updateAutoSaveStatus();
}

/**
 * Sets the last saved VSM for change detection
 * @param {import('./createVSM').ValueStreamMap} vsm - The VSM to set as last saved
 */
export function setLastSavedVSM(vsm) {
	lastSavedVSM = JSON.parse(JSON.stringify(vsm)); // Deep clone
	lastSavedTime = new Date();
	updateAutoSaveStatus();
}

/**
 * Checks if there are unsaved changes between the current and last saved VSM
 * @param {import('./createVSM').ValueStreamMap} currentVSM - Current VSM state
 * @returns {boolean} True if there are unsaved changes
 */
export function hasUnsavedChanges(currentVSM) {
	// If no VSM has been saved yet, always return true
	if (!lastSavedVSM) return true;

	// Compare simplified versions of the VSMs for change detection
	// This ignores calculated metrics, which may change even if no user edits occurred
	const simplifiedCurrent = simplifyVSMForComparison(currentVSM);
	const simplifiedLast = simplifyVSMForComparison(lastSavedVSM);

	return JSON.stringify(simplifiedCurrent) !== JSON.stringify(simplifiedLast);
}

/**
 * Creates a simplified version of the VSM for change detection
 * @param {import('./createVSM').ValueStreamMap} vsm - The VSM to simplify
 * @returns {Object} Simplified VSM for comparison
 */
function simplifyVSMForComparison(vsm) {
	// Extract only the user-editable properties that matter for change detection
	return {
		id: vsm.id,
		title: vsm.title,
		processes: vsm.processes.map((process) => ({
			id: process.id,
			name: process.name,
			position: process.position,
			metrics: {
				processTime: process.metrics.processTime,
				completeAccurate: process.metrics.completeAccurate
			}
		})),
		connections: vsm.connections.map((connection) => ({
			id: connection.id,
			sourceId: connection.sourceId,
			targetId: connection.targetId,
			isRework: connection.isRework,
			metrics: {
				waitTime: connection.metrics?.waitTime
			}
		}))
	};
}

/**
 * Gets the current file handle if available
 * @returns {FileSystemFileHandle} Current file handle or null
 */
export function getCurrentFileHandle() {
	return currentFileHandle;
}

/**
 * Initializes the file persistence module
 * Loads saved state from local storage
 */
export function initialize() {
	try {
		// Load auto-save status
		const statusJson = localStorage.getItem(STORAGE_KEYS.AUTO_SAVE_STATUS);
		if (statusJson) {
			const status = JSON.parse(statusJson);
			autoSaveEnabled = status.isEnabled;
			lastSavedTime = status.lastSaved ? new Date(status.lastSaved) : null;
		}

		// Load last saved VSM for change detection
		const lastSavedVsmJson = localStorage.getItem(STORAGE_KEYS.LAST_SAVED_VSM);
		if (lastSavedVsmJson) {
			lastSavedVSM = JSON.parse(lastSavedVsmJson);
		}
	} catch (error) {
		console.error('Error initializing file persistence:', error);
	}
}
