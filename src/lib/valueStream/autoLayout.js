/**
 * Module for automatic layout and positioning of VSM processes
 */

/**
 * Constants for layout configuration
 */
const LAYOUT_CONFIG = {
	DEFAULT_START_X: 50,
	DEFAULT_START_Y: 100,
	HORIZONTAL_SPACING: 200,
	VERTICAL_SPACING: 100,
	DEFAULT_BLOCK_WIDTH: 120,
	DEFAULT_BLOCK_HEIGHT: 80
};

/**
 * Calculates optimal positions for all processes based on their connections
 * @param {Array} processes - Array of process blocks
 * @param {Array} connections - Array of connections between processes
 * @param {Object} options - Layout options
 * @returns {Object} - Map of process IDs to their optimal positions
 */
function calculateOptimalPositions(processes, connections, options = {}) {
	// Use provided config or defaults
	const config = {
		...LAYOUT_CONFIG,
		...options
	};

	// Create a new positions map to store results
	const newPositions = {};

	// Create a graph representation for topological sorting
	const graph = createProcessGraph(processes, connections);

	// Identify processes with no incoming normal connections (potential start points)
	const startProcesses = processes.filter(
		(process) => !connections.some((conn) => conn.targetId === process.id && !conn.isRework)
	);

	// If we have no clear start processes, pick the leftmost existing process
	if (startProcesses.length === 0 && processes.length > 0) {
		const leftmostProcess = [...processes].sort((a, b) => a.position.x - b.position.x)[0];
		startProcesses.push(leftmostProcess);
	}

	// Calculate x-positions based on dependency levels
	const levels = calculateProcessLevels(graph);

	// Position processes at each level
	let currentX = config.DEFAULT_START_X;

	// Group processes by levels and assign x-coordinates
	Object.entries(levels).forEach(([level, processIds]) => {
		const levelX = currentX + Number(level) * config.HORIZONTAL_SPACING;

		// Distribute processes in this level vertically
		processIds.forEach((processId, index) => {
			const levelY = config.DEFAULT_START_Y + index * config.VERTICAL_SPACING;
			newPositions[processId] = { x: levelX, y: levelY };
		});
	});

	// Handle any processes not included in the levels (isolated processes)
	processes.forEach((process) => {
		if (!newPositions[process.id]) {
			// Place isolated processes at the right side
			const maxX = Object.values(newPositions).reduce(
				(max, pos) => Math.max(max, pos.x),
				config.DEFAULT_START_X
			);

			// Make sure isolated processes are clearly to the right of connected processes
			newPositions[process.id] = {
				x: maxX + config.HORIZONTAL_SPACING * 2,
				y: config.DEFAULT_START_Y + Object.keys(newPositions).length * 20
			};
		}
	});

	return newPositions;
}

/**
 * Creates a graph representation of processes and their connections
 * @param {Array} processes - Array of process blocks
 * @param {Array} connections - Array of connections between processes
 * @returns {Object} - Graph with adjacency lists
 */
function createProcessGraph(processes, connections) {
	const graph = {
		nodes: {},
		edges: {}
	};

	// Add all processes as nodes
	processes.forEach((process) => {
		graph.nodes[process.id] = {
			id: process.id,
			incomingNormal: [],
			outgoingNormal: [],
			incomingRework: [],
			outgoingRework: []
		};
		graph.edges[process.id] = [];
	});

	// Add connections as edges
	connections.forEach((connection) => {
		const { sourceId, targetId, isRework } = connection;

		// Skip if source or target is missing
		if (!graph.nodes[sourceId] || !graph.nodes[targetId]) {
			return;
		}

		// Add to appropriate lists based on connection type
		if (isRework) {
			graph.nodes[sourceId].outgoingRework.push(targetId);
			graph.nodes[targetId].incomingRework.push(sourceId);
		} else {
			graph.nodes[sourceId].outgoingNormal.push(targetId);
			graph.nodes[targetId].incomingNormal.push(sourceId);

			// Only use normal connections for layout
			graph.edges[sourceId].push(targetId);
		}
	});

	return graph;
}

/**
 * Calculates level for each process in the graph
 * @param {Object} graph - Graph with adjacency lists
 * @returns {Object} - Map of levels to arrays of process IDs
 */
function calculateProcessLevels(graph) {
	const levels = {};
	const visited = new Set();
	const inProgress = new Set();

	// Find all processes with no incoming normal connections
	const startNodes = Object.values(graph.nodes)
		.filter((node) => node.incomingNormal.length === 0)
		.map((node) => node.id);

	// If no clear starting nodes, use any node
	const nodesToProcess = startNodes.length > 0 ? startNodes : Object.keys(graph.nodes);

	// Process each node
	nodesToProcess.forEach((nodeId) => {
		calculateNodeLevel(nodeId, 0, graph, levels, visited, inProgress);
	});

	return levels;
}

/**
 * Recursively calculates the level for a node and its dependencies
 * @param {string} nodeId - Current node ID
 * @param {number} level - Current level
 * @param {Object} graph - Graph with adjacency lists
 * @param {Object} levels - Map of levels to process IDs
 * @param {Set} visited - Set of visited nodes
 * @param {Set} inProgress - Set of nodes being processed
 */
function calculateNodeLevel(nodeId, level, graph, levels, visited, inProgress) {
	// Skip if already visited at an equal or better level
	if (visited.has(nodeId)) {
		return;
	}

	// Detect cycles
	if (inProgress.has(nodeId)) {
		// Break cycle by keeping the node at its current level
		return;
	}

	// Add current node to in-progress set
	inProgress.add(nodeId);

	// Add node to this level
	if (!levels[level]) {
		levels[level] = [];
	}

	// Add to the level if not already there
	if (!levels[level].includes(nodeId)) {
		levels[level].push(nodeId);
	}

	// Mark as visited
	visited.add(nodeId);

	// Process outgoing edges (normal connections only)
	const outgoingNodes = graph.edges[nodeId] || [];
	outgoingNodes.forEach((targetId) => {
		calculateNodeLevel(targetId, level + 1, graph, levels, visited, inProgress);
	});

	// Remove from in-progress set
	inProgress.delete(nodeId);
}

/**
 * Gets recommended position for a new process based on existing processes
 * @param {Array} processes - Existing process blocks
 * @param {Array} connections - Optional connections to consider for better positioning
 * @param {Object} options - Layout options
 * @returns {Object} - Recommended {x, y} position
 */
function getRecommendedPosition(processes, connections = [], options = {}) {
	// Use provided config or defaults
	const config = {
		...LAYOUT_CONFIG,
		...options
	};

	// If no processes exist, return default starting position
	if (processes.length === 0) {
		return {
			x: config.DEFAULT_START_X,
			y: config.DEFAULT_START_Y
		};
	}

	// Find potential end processes (no outgoing normal connections)
	let endProcesses = [];
	if (connections.length > 0) {
		endProcesses = processes.filter(
			(process) => !connections.some((conn) => conn.sourceId === process.id && !conn.isRework)
		);
	}

	// If we found end processes, use those as reference points
	if (endProcesses.length > 0) {
		// Find the rightmost end process
		const rightmostEndProcess = [...endProcesses].sort((a, b) => b.position.x - a.position.x)[0];

		// Get average y position of end processes
		const avgEndY =
			endProcesses.reduce((sum, process) => sum + process.position.y, 0) / endProcesses.length;

		// Position to the right of the rightmost end process
		return {
			x: rightmostEndProcess.position.x + config.DEFAULT_BLOCK_WIDTH + config.HORIZONTAL_SPACING,
			y: avgEndY
		};
	}
	// Otherwise use the rightmost process regardless of connections
	else {
		// Find the rightmost process
		const rightmostProcess = [...processes].sort((a, b) => b.position.x - a.position.x)[0];

		// Calculate average y position of all processes
		const averageY =
			processes.reduce((sum, process) => sum + process.position.y, 0) / processes.length;

		// Place the new process to the right of the rightmost process
		return {
			x: rightmostProcess.position.x + config.DEFAULT_BLOCK_WIDTH + config.HORIZONTAL_SPACING,
			y: averageY
		};
	}
}

/**
 * Applies new positions to all processes
 * @param {Array} processes - Original process blocks
 * @param {Object} newPositions - Map of process IDs to new positions
 * @returns {Array} - Updated process blocks with new positions
 */
function applyLayout(processes, newPositions) {
	return processes.map((process) => {
		// Only update position if we have a new one for this process
		if (newPositions[process.id]) {
			return {
				...process,
				position: { ...newPositions[process.id] }
			};
		}

		// Otherwise keep the original position
		return { ...process };
	});
}

/**
 * Auto-arranges all processes in a VSM
 * @param {Array} processes - Process blocks to arrange
 * @param {Array} connections - Connections between processes
 * @param {Object} options - Layout options
 * @returns {Array} - Updated process blocks with new positions
 */
function autoArrangeProcesses(processes, connections, options = {}) {
	// Calculate optimal positions
	const newPositions = calculateOptimalPositions(processes, connections, options);

	// Apply the new layout
	return applyLayout(processes, newPositions);
}

export default {
	calculateOptimalPositions,
	getRecommendedPosition,
	applyLayout,
	autoArrangeProcesses
};
