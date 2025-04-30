/**
 * @typedef {import('./processBlock').ProcessBlock} ProcessBlock
 * @typedef {import('./connection').Connection} Connection
 */

/**
 * @typedef {Object} VSMMetrics
 * @property {number} totalLeadTime - Total lead time across all processes (best case)
 * @property {number} totalValueAddedTime - Sum of all value-adding process times
 * @property {number} valueAddedRatio - Ratio of value-added to total time
 * @property {number} totalReworkTime - Additional time for rework cycles (sum of process times + wait times for rework paths)
 * @property {number} worstCaseLeadTime - Lead time including all possible rework (exception lead time)
 * @property {number} averageLeadTime - Probability-weighted lead time including rework
 * @property {Object.<string, number>} cycleTimeByProcess - Cycle time for each process
 * @property {Object.<string, number>} reworkCycleTimeByProcess - Rework cycle time for each process
 */

/**
 * @typedef {Object} ValueStreamMap
 * @property {string} id - Unique identifier for the VSM
 * @property {string} title - Title of the VSM
 * @property {Array<ProcessBlock>} processes - Process blocks in the VSM
 * @property {Array<Connection>} connections - Connections between processes
 * @property {VSMMetrics} metrics - VSM-level metrics
 */

/**
 * Creates a new Value Stream Map
 * @param {Object} params - VSM parameters
 * @param {string} params.id - Unique identifier
 * @param {string} params.title - VSM title
 * @param {Array<ProcessBlock>} [params.processes=[]] - Process blocks
 * @param {Array<Connection>} [params.connections=[]] - Connections
 * @returns {ValueStreamMap} - New Value Stream Map
 */
function createVSM({ id, title, processes = [], connections = [] }) {
	// Calculate VSM metrics based on processes and connections
	const metrics = calculateMetrics(processes, connections);

	return {
		id,
		title,
		processes: [...processes],
		connections: [...connections],
		metrics
	};
}

/**
 * Calculates VSM metrics from processes and connection wait times
 * @param {Array<ProcessBlock>} processes - Process blocks
 * @param {Array<Connection>} connections - Connections with wait times
 * @returns {VSMMetrics} - Calculated metrics
 */
function calculateMetrics(processes, connections) {
	// Create maps for relationships
	const incomingConnections = {}; // Normal incoming connections
	const incomingRework = {}; // Rework/feedback connections
	const outgoingConnections = {}; // Normal outgoing connections
	const outgoingRework = {}; // Rework outgoing connections
	const processMap = {}; // Map of processes by ID
	const previousProcessMap = {}; // Map of each process to its previous process in the flow

	// Sort processes by x position (left to right) for determining process flow
	const sortedProcesses = [...processes].sort((a, b) => {
		const aX = a.position?.x || 0;
		const bX = b.position?.x || 0;
		return aX - bX;
	});

	// Build a lookup for previous processes in the flow
	// This helps us determine implicit rework connections
	for (let i = 1; i < sortedProcesses.length; i++) {
		previousProcessMap[sortedProcesses[i].id] = sortedProcesses[i - 1].id;
	}

	// Build process map for easy lookup
	processes.forEach((process) => {
		processMap[process.id] = process;
	});

	// Identify the last process in the flow (no outgoing normal connections)
	const lastProcesses = sortedProcesses.filter((process) => {
		return !connections.some((conn) => conn.sourceId === process.id && !conn.isRework);
	});

	// According to spec, the last process should not have C/A set
	lastProcesses.forEach((process) => {
		delete process.metrics.completeAccurate;
	});

	// Classify connections as normal or rework
	connections.forEach((connection) => {
		// Set explicit isRework flag if not already set
		// (rework connections go from right to left in the layout)
		const sourceProcess = processMap[connection.sourceId];
		const targetProcess = processMap[connection.targetId];

		if (sourceProcess && targetProcess) {
			// Determine if connection is a rework connection based on positions or explicit flag
			const isRework = connection.isRework || sourceProcess.position.x > targetProcess.position.x;

			// Update connection with explicit rework flag if needed
			if (isRework && !connection.isRework) {
				connection.isRework = true;
			}

			// Sort into appropriate maps
			if (isRework) {
				// Incoming rework connections (to target)
				if (!incomingRework[connection.targetId]) {
					incomingRework[connection.targetId] = [];
				}
				incomingRework[connection.targetId].push(connection);

				// Outgoing rework connections (from source)
				if (!outgoingRework[connection.sourceId]) {
					outgoingRework[connection.sourceId] = [];
				}
				outgoingRework[connection.sourceId].push(connection);
			} else {
				// Incoming normal connections (to target)
				if (!incomingConnections[connection.targetId]) {
					incomingConnections[connection.targetId] = [];
				}
				incomingConnections[connection.targetId].push(connection);

				// Outgoing normal connections (from source)
				if (!outgoingConnections[connection.sourceId]) {
					outgoingConnections[connection.sourceId] = [];
				}
				outgoingConnections[connection.sourceId].push(connection);
			}
		}
	});

	// Calculate best-case cycle times
	const processCycleTimes = {};

	// STEP 1: Calculate normal cycle times for each process (best case)
	processes.forEach((process) => {
		// Process time
		const processTime = process.metrics.processTime || 0;

		// Sum of wait times from incoming connections (normal flow only)
		let incomingWaitTime = 0;
		if (incomingConnections[process.id]) {
			incomingWaitTime = incomingConnections[process.id].reduce(
				(sum, conn) => sum + (conn.metrics?.waitTime || 0),
				0
			);
		}

		// Best case cycle time: process time + incoming wait time (normal flow)
		processCycleTimes[process.id] = processTime + incomingWaitTime;
	});

	// STEP 2: Calculate rework paths and times
	const reworkCycleTimes = {}; // Rework time for each process
	const reworkPaths = {}; // Details of rework paths for each process
	const reworkLeadTimes = {}; // Total lead time for work that gets rejected and reworked

	// STEP 2.0: Calculate rework for first process according to spec
	// The first process with C/A < 100% should have rework as its own process time * rework probability
	const firstProcess = sortedProcesses[0];
	if (firstProcess) {
		const processId = firstProcess.id;
		const completeAccurate =
			firstProcess.metrics.completeAccurate !== undefined
				? firstProcess.metrics.completeAccurate
				: 100;

		if (completeAccurate < 100) {
			const reworkProbability = (100 - completeAccurate) / 100;
			const processTime = firstProcess.metrics.processTime || 0;

			// First process rework is its own process time * probability (per spec)
			reworkCycleTimes[processId] = processTime * reworkProbability;

			// Add to rework paths
			reworkPaths[processId] = {
				targetId: processId, // Self-rework
				probability: reworkProbability,
				processIds: [processId],
				processTimes: [processTime],
				waitTimes: [0],
				totalReworkTime: processTime,
				isImplicit: true
			};
		}
	}

	// STEP 2.1: Find all explicit rework connections and calculate their paths
	connections.forEach((connection) => {
		if (connection.isRework) {
			const sourceId = connection.sourceId; // Process where work is rejected
			const targetId = connection.targetId; // Process where work goes back to
			const sourceProcess = processMap[sourceId];
			const targetProcess = processMap[targetId];

			// Only calculate if we have both processes
			if (sourceProcess && targetProcess) {
				// Calculate the rework probability from the source process (rejection rate)
				const completeAccurate =
					sourceProcess.metrics.completeAccurate !== undefined
						? sourceProcess.metrics.completeAccurate
						: 100;
				const reworkProbability = (100 - completeAccurate) / 100;

				// Skip if no rework happens
				if (reworkProbability <= 0) {
					return; // Skip this iteration
				}

				// Calculate the rework path from target back to source
				// 1. Start with the rework connection wait time
				const reworkWaitTime = connection.metrics?.waitTime || 0;

				// 2. Calculate the full rework path - from target process back through to source
				const reworkProcessIds = [];
				const reworkProcessTimes = [];
				const reworkWaitTimes = [];

				// Add initial rework wait time for the rework connection
				reworkWaitTimes.push(reworkWaitTime);

				// Start with the target process
				let currentId = targetId;
				reworkProcessIds.push(currentId);
				reworkProcessTimes.push(processMap[currentId].metrics.processTime || 0);

				// Follow the normal flow to find all processes that will be reworked
				while (currentId && currentId !== sourceId) {
					// Find the normal connection leaving this process
					const outgoingConn = connections.find(
						(conn) => conn.sourceId === currentId && !conn.isRework
					);

					if (!outgoingConn) {
						break;
					}

					// Add wait time for this connection
					reworkWaitTimes.push(outgoingConn.metrics?.waitTime || 0);

					// Move to next process
					currentId = outgoingConn.targetId;

					// Add this process to the rework path
					reworkProcessIds.push(currentId);
					reworkProcessTimes.push(processMap[currentId].metrics.processTime || 0);
				}

				// Calculate the total rework time
				// Sum of process times + wait times in the rework path
				let totalReworkTime = 0;

				// Add process times
				for (let i = 0; i < reworkProcessTimes.length; i++) {
					totalReworkTime += reworkProcessTimes[i];
				}

				// Add wait times between steps
				for (let i = 0; i < reworkWaitTimes.length; i++) {
					totalReworkTime += reworkWaitTimes[i];
				}

				// Store full rework path details - now assigned to target process instead of source
				reworkPaths[targetId] = {
					sourceId,
					probability: reworkProbability,
					processIds: reworkProcessIds,
					processTimes: reworkProcessTimes,
					waitTimes: reworkWaitTimes,
					totalReworkTime,
					isExplicit: true
				};

				// Store rework cycle time for target process (weighted by probability)
				// This assigns rework to the process receiving the rework (targetId) rather than the process sending it
				reworkCycleTimes[targetId] = totalReworkTime * reworkProbability;

				// Calculate the full lead time for work that gets rejected
				// This is the base case lead time + rework time
				const totalLeadTime = Object.values(processCycleTimes).reduce((sum, time) => sum + time, 0);
				reworkLeadTimes[targetId] = totalLeadTime + totalReworkTime;
			}
		}
	});

	// STEP 2.2: Create implicit rework connections for processes with C/A < 100% but no explicit rework
	processes.forEach((process) => {
		const processId = process.id;

		// Skip if this process already has an explicit rework connection (incoming or outgoing)
		// We already calculated rework for processes with explicit rework connections in STEP 2.1
		if (outgoingRework[processId] || incomingRework[processId]) {
			return;
		}

		// Skip if this is the first process (already handled in step 2.0)
		if (process === firstProcess) {
			return;
		}

		// Check if C/A < 100%, which indicates rework is needed
		const completeAccurate =
			process.metrics.completeAccurate !== undefined ? process.metrics.completeAccurate : 100;

		// Only create implicit rework if C/A < 100%
		if (completeAccurate >= 100) {
			return;
		}

		// Calculate rework according to specification in rework.md with no special cases

		// Calculate the rework probability for this process
		const reworkProbability = (100 - completeAccurate) / 100;

		// Find the previous process in the flow to create an implicit rework connection
		const previousProcessId = previousProcessMap[processId];

		// Skip the first process that doesn't have a previous step (unlikely due to earlier checks)
		if (!previousProcessId) {
			return;
		}

		const previousProcess = processMap[previousProcessId];
		if (!previousProcess) {
			return;
		}

		// Calculate the implicit rework path
		// Find the normal connection from previous to current process
		const normalConnection = connections.find(
			(conn) => conn.sourceId === previousProcessId && conn.targetId === processId && !conn.isRework
		);

		if (!normalConnection) {
			return;
		}

		// Get the wait time from the normal connection
		const waitTime = normalConnection.metrics?.waitTime || 0;

		// Calculate the total rework time
		// For implicit rework, the path is: current process -> previous process -> current process

		// Process time of the current process
		const currentProcessTime = process.metrics.processTime || 0;

		// According to specification, for implicit rework:
		// Rework time includes the wait time + current process time
		// For Process 2: Wait Time (5) + Process 2 (20) = 25
		// For Process 3: Wait Time (10) + Process 3 (30) = 40

		// Calculate rework time as wait time + current process time
		let totalReworkTime = waitTime + currentProcessTime;

		// Calculate according to rework.md with no special cases

		// Store rework path details
		reworkPaths[processId] = {
			targetId: previousProcessId,
			probability: reworkProbability,
			processIds: [processId],
			processTimes: [currentProcessTime],
			waitTimes: [waitTime],
			totalReworkTime,
			isImplicit: true
		};

		// Store rework cycle time for this process (weighted by probability)
		reworkCycleTimes[processId] = totalReworkTime * reworkProbability;

		// Calculate the full lead time for work that gets rejected
		const totalLeadTime = Object.values(processCycleTimes).reduce((sum, time) => sum + time, 0);
		reworkLeadTimes[processId] = totalLeadTime + totalReworkTime;
	});

	// STEP 3: Calculate total metrics
	const totalLeadTime = Object.values(processCycleTimes).reduce((sum, time) => sum + time, 0);

	// Calculate total rework time as the sum of all rework cycle times
	let totalReworkTime = 0;
	for (const processId in reworkCycleTimes) {
		totalReworkTime += reworkCycleTimes[processId];
	}

	// Calculate worst case (exception) lead time
	// According to spec, this should be lead time + total rework
	let worstCaseLeadTime = totalLeadTime + totalReworkTime;

	// Average lead time is normal lead time plus weighted rework times
	let averageLeadTime = totalLeadTime + totalReworkTime;

	// No special cases - calculate metrics according to rework.md specification

	// Total value-added time: Sum of process times only (no wait time)
	const totalValueAddedTime = processes.reduce(
		(sum, process) => sum + (process.metrics.processTime || 0),
		0
	);

	// Value-added ratio: Value-added time / Best case lead time
	const valueAddedRatio = totalLeadTime > 0 ? totalValueAddedTime / totalLeadTime : 0;

	// Update process objects with rework times for display
	processes.forEach((process) => {
		process.metrics.reworkCycleTime = reworkCycleTimes[process.id] || 0;
	});

	return {
		totalLeadTime,
		totalValueAddedTime,
		valueAddedRatio,
		totalReworkTime,
		worstCaseLeadTime,
		averageLeadTime,
		cycleTimeByProcess: processCycleTimes,
		reworkCycleTimeByProcess: reworkCycleTimes
	};
}

/**
 * Updates an existing VSM
 * @param {ValueStreamMap} vsm - Existing VSM to update
 * @param {Object} updates - Properties to update
 * @returns {ValueStreamMap} - Updated VSM (new instance)
 */
function updateVSM(vsm, updates) {
	const updatedVSM = {
		...vsm,
		...updates
	};

	// If processes are updated, ensure it's a new array
	if (updates.processes) {
		updatedVSM.processes = [...updates.processes];
	}

	// If connections are updated, ensure it's a new array
	if (updates.connections) {
		updatedVSM.connections = [...updates.connections];
	}

	// Recalculate metrics if processes or connections change
	if (updates.processes || updates.connections) {
		updatedVSM.metrics = calculateMetrics(updatedVSM.processes, updatedVSM.connections);
	}

	return updatedVSM;
}

/**
 * Adds a process to a VSM
 * @param {ValueStreamMap} vsm - Existing VSM
 * @param {ProcessBlock} process - Process to add
 * @returns {ValueStreamMap} - Updated VSM with new process
 */
function addProcess(vsm, process) {
	return updateVSM(vsm, {
		processes: [...vsm.processes, process]
	});
}

/**
 * Adds a connection to a VSM
 * @param {ValueStreamMap} vsm - Existing VSM
 * @param {Connection} connection - Connection to add
 * @returns {ValueStreamMap} - Updated VSM with new connection
 */
function addConnection(vsm, connection) {
	return updateVSM(vsm, {
		connections: [...vsm.connections, connection]
	});
}

export default {
	create: createVSM,
	update: updateVSM,
	addProcess,
	addConnection
};
