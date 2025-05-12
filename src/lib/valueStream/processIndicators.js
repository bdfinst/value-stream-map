/**
 * Utility functions for determining process flow status and providing visual indicators
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
 * Gets the flow status of a process (first, last, or middle)
 * @param {string} processId - ID of the process to check
 * @param {Array} connections - All connections in the VSM
 * @returns {Object} - Object with isFirst and isLast properties
 */
function getProcessFlowStatus(processId, connections) {
	return {
		isFirst: isFirstProcess(processId, connections),
		isLast: isLastProcess(processId, connections)
	};
}

/**
 * Gets the CSS classes to apply to a process based on its flow status
 * @param {string} processId - ID of the process to check
 * @param {Array} connections - All connections in the VSM
 * @returns {string} - CSS classes to apply
 */
function getProcessStatusClasses(processId, connections) {
	const { isFirst, isLast } = getProcessFlowStatus(processId, connections);

	const classes = [];

	if (isFirst) {
		classes.push('process-first');
	}

	if (isLast) {
		classes.push('process-last');
	}

	return classes.join(' ');
}

/**
 * Gets attributes to apply to a process block for visual indications
 * @param {string} processId - ID of the process to check
 * @param {Array} connections - All connections in the VSM
 * @returns {Object} - Object with attributes to apply (strokeColor, strokeWidth, etc.)
 */
function getProcessVisualAttributes(processId, connections) {
	const { isFirst, isLast } = getProcessFlowStatus(processId, connections);

	// Default attributes
	const attributes = {
		stroke: '#333',
		strokeWidth: 2,
		fillColor: '#f0f0f0',
		indicator: null
	};

	// Apply special styling based on process position in flow
	if (isFirst && isLast) {
		// Process is both first and last (only process in the flow)
		attributes.stroke = '#800080'; // Purple
		attributes.indicator = 'first-last';
	} else if (isFirst) {
		// Process is the first in the flow
		attributes.stroke = '#008000'; // Green
		attributes.indicator = 'first';
	} else if (isLast) {
		// Process is the last in the flow
		attributes.stroke = '#0000ff'; // Blue
		attributes.indicator = 'last';
	}

	return attributes;
}

export default {
	isFirstProcess,
	isLastProcess,
	getProcessFlowStatus,
	getProcessStatusClasses,
	getProcessVisualAttributes
};
