/**
 * Utilities for enhancing connection UI and user experience
 */

/**
 * Generates a tooltip text for a connection
 * @param {Object} connection - The connection
 * @param {Array} processes - All processes in the VSM
 * @returns {string} - The tooltip text
 */
function getConnectionTooltip(connection, processes) {
	// Get a description of the connection
	const description = getConnectionDescription(connection, processes);

	// Get additional information
	const waitTime = connection.metrics?.waitTime || 0;

	// Build the tooltip
	let tooltip = description;

	// Add specific details
	if (connection.isRework) {
		tooltip += '\nRework Connection';
	}

	tooltip += `\nWait Time: ${waitTime}`;

	return tooltip;
}

/**
 * Determines if a connection needs a tooltip with additional information
 * @param {Object} connection - The connection to check
 * @returns {boolean} - Whether a tooltip should be shown
 */
function shouldShowTooltip(connection) {
	// Show tooltip for rework connections
	if (connection.isRework) {
		return true;
	}

	// Show tooltip for connections with wait time
	if (connection.metrics?.waitTime > 0) {
		return true;
	}

	// Default: no tooltip needed for simple connections
	return false;
}

/**
 * Gets the visual attributes for a connection based on its properties
 * @param {Object} connection - The connection
 * @returns {Object} - The visual attributes (stroke, width, opacity, etc.)
 */
function getConnectionVisualAttributes(connection) {
	// Default attributes
	const attributes = {
		stroke: connection.isRework ? '#e53e3e' : '#555', // Default: red for rework, gray for normal
		strokeWidth: 2,
		strokeOpacity: 1,
		arrowMarker: connection.isRework ? 'arrow-red' : 'arrow'
	};

	// Adjust stroke width based on wait time
	const waitTime = connection.metrics?.waitTime || 0;
	if (waitTime > 20) {
		// Thicker lines for high wait times
		attributes.strokeWidth = 4;
	} else if (waitTime > 10) {
		attributes.strokeWidth = 3;
	}

	return attributes;
}

/**
 * Gets the connection description (for display, tooltips, etc.)
 * @param {Object} connection - The connection
 * @param {Array} processes - All processes in the VSM
 * @returns {string} - A human-readable description of the connection
 */
function getConnectionDescription(connection, processes) {
	// Find source and target process names
	const sourceProcess = processes.find((p) => p.id === connection.sourceId);
	const targetProcess = processes.find((p) => p.id === connection.targetId);

	if (!sourceProcess || !targetProcess) {
		return 'Connection';
	}

	const sourceName = sourceProcess.name;
	const targetName = targetProcess.name;
	const waitTime = connection.metrics?.waitTime || 0;

	// Create a description
	let description = `${sourceName} → ${targetName}`;

	if (connection.isRework) {
		description += ' (Rework)';
	}

	description += `, Wait: ${waitTime}`;

	return description;
}

/**
 * Gets recommended path for a new connection based on existing layout
 * @param {string} sourceId - Source process ID
 * @param {string} targetId - Target process ID
 * @param {Array} processes - All processes in the VSM
 * @returns {Array} - Recommended path points [[x1,y1], [x2,y2], ...]
 */
function getRecommendedPath(sourceId, targetId, processes) {
	// Find source and target processes
	const sourceProcess = processes.find((p) => p.id === sourceId);
	const targetProcess = processes.find((p) => p.id === targetId);

	// Default empty path if processes not found
	if (!sourceProcess || !targetProcess) {
		return [];
	}

	// Block dimensions (you might want to get these from actual configuration)
	const blockWidth = 120;
	const blockHeight = 80;

	// Calculate connection points based on connection type
	let sourceX, sourceY, targetX, targetY;

	// Check if this is a rework connection (going to a previous process)
	// Consider it rework if source is to the right of target (based on positions)
	const isReworkConnection = sourceProcess.position.x > targetProcess.position.x;

	if (isReworkConnection) {
		// For rework connections, use center-top
		sourceX = sourceProcess.position.x + blockWidth / 2;
		sourceY = sourceProcess.position.y;
		targetX = targetProcess.position.x + blockWidth / 2;
		targetY = targetProcess.position.y;
	} else {
		// For normal connections, use sides
		sourceX = sourceProcess.position.x + blockWidth;
		sourceY = sourceProcess.position.y + blockHeight / 2;
		targetX = targetProcess.position.x;
		targetY = targetProcess.position.y + blockHeight / 2;
	}

	// Generate different paths based on connection type
	if (isReworkConnection) {
		// Calculate a higher arc for rework connections
		const arcHeight = Math.min(80, Math.abs(sourceX - targetX) * 0.3);
		const midY = Math.min(sourceY, targetY) - arcHeight;
		const midX = (sourceX + targetX) / 2;

		// Rework connection (curved path over the top)
		return [
			[sourceX, sourceY], // Start at the top of source
			[sourceX, sourceY - 30], // Go up from source
			[sourceX + (midX - sourceX) * 0.5, midY], // Curve towards middle
			[midX, midY], // Midpoint of the arc
			[targetX + (midX - targetX) * 0.5, midY], // Curve towards target
			[targetX, targetY - 30], // Above target
			[targetX, targetY] // End at the top of target
		];
	} else {
		// Standard connection (mostly straight line)
		return [
			[sourceX, sourceY],
			[sourceX + (targetX - sourceX) / 3, sourceY],
			[targetX - (targetX - sourceX) / 3, targetY],
			[targetX, targetY]
		];
	}
}

export default {
	getConnectionTooltip,
	shouldShowTooltip,
	getConnectionVisualAttributes,
	getConnectionDescription,
	getRecommendedPath
};
