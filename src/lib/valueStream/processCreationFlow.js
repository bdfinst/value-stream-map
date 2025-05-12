import connection from './connection.js';
import { get } from 'svelte/store';

/**
 * Flow types for process creation
 * @typedef {Object} ProcessCreationCallbacks
 * @property {Function} showConnectionModal - Function to show/hide the connection modal
 * @property {Function} setCurrentConnection - Function to set the current connection being edited
 * @property {Function} [setCurrentProcess] - Optional function to set the current process being edited
 */

/**
 * Determines if a process is the first in the flow (has no incoming connections)
 * @param {string} processId - ID of the process to check
 * @param {Array} connections - All connections in the VSM
 * @returns {boolean} - True if this is the first process
 */
function isFirstProcess(processId, connections) {
	return !connections.some((conn) => conn.targetId === processId && !conn.isRework);
}

/**
 * Determines if a process is the last in the flow (has no outgoing connections)
 * @param {string} processId - ID of the process to check
 * @param {Array} connections - All connections in the VSM
 * @returns {boolean} - True if this is the last process
 */
function isLastProcess(processId, connections) {
	return !connections.some((conn) => conn.sourceId === processId && !conn.isRework);
}

/**
 * Finds the most logical process to be a source for a new connection
 * @param {Array} processes - All processes in the VSM
 * @param {Array} connections - All connections in the VSM
 * @returns {Object|null} - The potential source process or null if none found
 */
function findPotentialSourceProcess(processes, connections) {
	if (processes.length === 0) {
		return null;
	}

	// Find processes that don't have any outgoing normal (non-rework) connections
	// These are the "end" processes in the current flow
	const endProcesses = processes.filter((process) => isLastProcess(process.id, connections));

	if (endProcesses.length > 0) {
		// Return the first end process found
		return endProcesses[0];
	}

	// If no end process found, return the last process in the array
	// This is a fallback that might not be logically correct but provides a default
	return processes[processes.length - 1];
}

/**
 * Creates a pre-filled connection between source and target processes
 * @param {Object} source - Source process
 * @param {Object} target - Target process
 * @param {number} connectionCount - Count of existing connections (for ID generation)
 * @returns {Object} - The new connection object
 */
function createPrefilledConnection(source, target, connectionCount) {
	const newConnectionId = `conn${connectionCount + 1}_${Date.now()}`;
	return connection.create({
		id: newConnectionId,
		sourceId: source ? source.id : '',
		targetId: target.id,
		metrics: { waitTime: 0 }
	});
}

/**
 * Prompts for connection creation after a new process is added
 * @param {Object} vsmStore - The VSM store instance
 * @param {Object} newProcess - The newly created process
 * @param {ProcessCreationCallbacks} callbacks - UI callback functions
 * @returns {boolean} - Whether a connection prompt was shown
 */
function promptConnectionAfterProcessCreation(vsmStore, newProcess, callbacks) {
	// Get the current state of the VSM
	const vsmState = get(vsmStore);
	const existingProcesses = vsmState.vsm.processes.filter((p) => p.id !== newProcess.id);

	// Don't prompt for the first process
	if (existingProcesses.length === 0) {
		return false;
	}

	// Find a suitable source process
	// In most workflows, the last process in the current flow would be the logical source
	const potentialSourceProcess = findPotentialSourceProcess(
		existingProcesses,
		vsmState.vsm.connections
	);

	// Create a new connection
	const newConnection = createPrefilledConnection(
		potentialSourceProcess,
		newProcess,
		vsmState.vsm.connections.length
	);

	// Set the connection and show the modal
	callbacks.setCurrentConnection(newConnection);
	callbacks.showConnectionModal(true);

	return true;
}

export default {
	promptConnectionAfterProcessCreation,
	isFirstProcess,
	isLastProcess,
	findPotentialSourceProcess
};
