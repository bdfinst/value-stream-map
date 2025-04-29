/**
 * @typedef {import('./processBlock').ProcessBlock} ProcessBlock
 * @typedef {import('./connection').Connection} Connection
 */

/**
 * @typedef {Object} VSMMetrics
 * @property {number} totalLeadTime - Total lead time across all processes (best case)
 * @property {number} totalValueAddedTime - Sum of all value-adding process times
 * @property {number} valueAddedRatio - Ratio of value-added to total time
 * @property {number} totalReworkTime - Additional time for rework cycles
 * @property {number} worstCaseLeadTime - Lead time including all possible rework
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
function createVSM({
  id,
  title,
  processes = [],
  connections = []
}) {
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
  const incomingRework = {};      // Rework/feedback connections
  const processMap = {};          // Map of processes by ID
  
  // Build process map for easy lookup
  processes.forEach(process => {
    processMap[process.id] = process;
  });
  
  // Classify connections as normal or rework
  connections.forEach(connection => {
    // Set explicit isRework flag if not already set
    // (rework connections go from right to left in the layout)
    const sourceProcess = processMap[connection.sourceId];
    const targetProcess = processMap[connection.targetId];
    
    if (sourceProcess && targetProcess) {
      // Determine if connection is a rework connection based on positions
      const isRework = connection.isRework || 
        (sourceProcess.position.x > targetProcess.position.x);
      
      // Update connection with explicit rework flag if needed
      if (isRework && !connection.isRework) {
        connection.isRework = true;
      }
      
      // Sort into appropriate map
      if (isRework) {
        if (!incomingRework[connection.targetId]) {
          incomingRework[connection.targetId] = [];
        }
        incomingRework[connection.targetId].push(connection);
      } else {
        if (!incomingConnections[connection.targetId]) {
          incomingConnections[connection.targetId] = [];
        }
        incomingConnections[connection.targetId].push(connection);
      }
    }
  });
  
  // Calculate best-case cycle times and identify rework paths
  let totalWaitTime = 0;
  const processCycleTimes = {};
  const reworkCycleTimes = {};
  
  // STEP 1: Calculate normal cycle times for each process (best case)
  processes.forEach(process => {
    // Process time from the process itself
    const processTime = process.metrics.processTime || 0;
    
    // Sum of wait times from incoming connections (normal flow only)
    let incomingWaitTime = 0;
    if (incomingConnections[process.id]) {
      incomingWaitTime = incomingConnections[process.id].reduce(
        (sum, conn) => sum + (conn.metrics?.waitTime || 0), 0);
      
      // Add to total wait time
      totalWaitTime += incomingWaitTime;
    }
    
    // Best case cycle time: process time + incoming wait time (normal flow)
    processCycleTimes[process.id] = processTime + incomingWaitTime;
  });
  
  // STEP 2: Calculate rework paths - recursive function to handle nested loops
  function calculateReworkTime(processId, visitedMap = {}) {
    // If we've already calculated for this process or no rework inputs, return 0
    if (reworkCycleTimes[processId] !== undefined) {
      return reworkCycleTimes[processId];
    }
    
    // If we've visited this process already in this path, we're in a cycle
    if (visitedMap[processId]) {
      return 0;
    }
    
    // Mark this process as visited in this path
    const newVisitedMap = { ...visitedMap, [processId]: true };
    
    // Get Process C/A percentage (how often rework is not needed)
    const process = processMap[processId];
    const completeAccurate = process ? (process.metrics.completeAccurate || 100) : 100;
    
    // Calculate rework probability (1 - C/A%)
    const reworkProbability = (100 - completeAccurate) / 100;
    
    // If no rework is ever needed, return 0 
    if (reworkProbability <= 0) {
      reworkCycleTimes[processId] = 0;
      return 0;
    }
    
    // Get incoming rework connections
    const reworkConnections = incomingRework[processId] || [];
    
    // If no explicit rework connections but C/A < 100%, assume self-rework
    if (reworkConnections.length === 0 && reworkProbability > 0) {
      // Self-rework: just the process's own cycle time weighted by rework probability
      const reworkTime = processCycleTimes[processId] * reworkProbability;
      reworkCycleTimes[processId] = reworkTime;
      return reworkTime;
    }
    
    // Calculate rework time from explicit rework connections
    let totalReworkTime = 0;
    
    reworkConnections.forEach(conn => {
      const sourceId = conn.sourceId;
      const waitTime = conn.metrics?.waitTime || 0;
      
      // Calculate rework path from the source process
      // (this is a recursive call that walks through the path)
      let pathReworkTime = 0;
      
      // Avoid infinite recursion by checking if we've visited this process
      if (!newVisitedMap[sourceId]) {
        // Get all processes from source to this process
        pathReworkTime += calculateReworkTime(sourceId, newVisitedMap);
        
        // Add the cycle time of the source process
        pathReworkTime += processCycleTimes[sourceId] || 0;
      }
      
      // Add wait time of the rework connection
      pathReworkTime += waitTime;
      
      // Weight by rework probability
      totalReworkTime += pathReworkTime * reworkProbability;
    });
    
    // Store the result for this process
    reworkCycleTimes[processId] = totalReworkTime;
    return totalReworkTime;
  }
  
  // Calculate rework times for all processes
  processes.forEach(process => {
    calculateReworkTime(process.id);
  });
  
  // STEP 3: Calculate total metrics
  // Best case: Sum of all normal cycle times
  const totalLeadTime = Object.values(processCycleTimes).reduce((sum, time) => sum + time, 0);
  
  // Total value-added time: Sum of process times only (no wait time)
  const totalValueAddedTime = processes.reduce(
    (sum, process) => sum + (process.metrics.processTime || 0), 0
  );
  
  // Total rework time: Sum of all rework cycle times
  const totalReworkTime = Object.values(reworkCycleTimes).reduce((sum, time) => sum + time, 0);
  
  // Worst case lead time: Best case + rework time
  const worstCaseLeadTime = totalLeadTime + totalReworkTime;
  
  // Value-added ratio: Value-added time / Best case lead time
  const valueAddedRatio = totalLeadTime > 0
    ? totalValueAddedTime / totalLeadTime
    : 0;
  
  // Update process objects with rework times for display
  processes.forEach(process => {
    process.metrics.reworkCycleTime = reworkCycleTimes[process.id] || 0;
  });
  
  return {
    totalLeadTime,
    totalValueAddedTime,
    valueAddedRatio,
    totalReworkTime,
    worstCaseLeadTime
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
    updatedVSM.metrics = calculateMetrics(
      updatedVSM.processes,
      updatedVSM.connections
    );
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
