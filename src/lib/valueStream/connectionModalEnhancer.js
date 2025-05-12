/**
 * @typedef {import('./processBlock').ProcessBlock} ProcessBlock
 */

/**
 * Enhances a connection modal by providing guidance and preselection for newly created processes
 */

/**
 * Determines if the given process is new (not yet connected to any other process)
 * @param {string} processId - ID of the process to check
 * @param {Array} connections - All connections in the VSM
 * @returns {boolean} - True if the process is not connected yet
 */
function isNewProcess(processId, connections) {
	return !connections.some((conn) => conn.sourceId === processId || conn.targetId === processId);
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
 * Gets the most suitable process to connect to a new process
 * @param {Array<ProcessBlock>} processes - All processes in the VSM
 * @param {Array} connections - All connections in the VSM
 * @param {string} newProcessId - ID of the newly created process
 * @returns {ProcessBlock|null} - The process to connect to, or null if none found
 */
function getSuggestedProcessToConnect(processes, connections, newProcessId) {
	// If there are no other processes besides the new one, return null
	const otherProcesses = processes.filter((p) => p.id !== newProcessId);
	if (otherProcesses.length === 0) {
		return null;
	}

	// Find processes that don't have any outgoing normal (non-rework) connections
	// These are the "end" processes in the current flow
	const endProcesses = otherProcesses.filter((process) => isLastProcess(process.id, connections));

	if (endProcesses.length > 0) {
		// Return the first end process found
		return endProcesses[0];
	}

	// If no end process found, return the last process in the array
	// This is a fallback that might not be logically correct but provides a default
	return otherProcesses[otherProcesses.length - 1];
}

/**
 * Pre-fills a connection based on the current VSM state and the new process
 * @param {Object} connection - The connection object to pre-fill
 * @param {Array<ProcessBlock>} processes - All processes in the VSM
 * @param {Array} connections - All connections in the VSM
 * @param {string} newProcessId - ID of the newly created process
 * @returns {Object} - The pre-filled connection object
 */
function preSelectConnectionValues(connection, processes, connections, newProcessId) {
	// Create a copy of the connection to avoid modifying the original
	const updatedConnection = { ...connection };

	// Only update the connection if it doesn't already have values
	if (!updatedConnection.sourceId || !updatedConnection.targetId) {
		// Set the target to the new process
		updatedConnection.targetId = newProcessId;

		// Find a suggested source process
		const suggestedSource = getSuggestedProcessToConnect(processes, connections, newProcessId);
		if (suggestedSource) {
			updatedConnection.sourceId = suggestedSource.id;
		}

		// Ensure metrics exist and set waitTime to 0 if not already set
		if (!updatedConnection.metrics) {
			updatedConnection.metrics = { waitTime: 0 };
		} else if (updatedConnection.metrics.waitTime === undefined) {
			updatedConnection.metrics.waitTime = 0;
		}
	}

	return updatedConnection;
}

export default {
	isNewProcess,
	getSuggestedProcessToConnect,
	preSelectConnectionValues
};
