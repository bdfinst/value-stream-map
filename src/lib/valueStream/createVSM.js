/**
 * @typedef {import('./processBlock').ProcessBlock} ProcessBlock
 * @typedef {import('./connection').Connection} Connection
 */

/**
 * @typedef {Object} VSMMetrics
 * @property {number} totalLeadTime - Total lead time across all processes
 * @property {number} totalValueAddedTime - Sum of all value-adding process times
 * @property {number} valueAddedRatio - Ratio of value-added to total time
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
 * Calculates VSM metrics from processes only
 * @param {Array<ProcessBlock>} processes - Process blocks
 * @param {Array<Connection>} connections - Connections (not used for metrics anymore)
 * @returns {VSMMetrics} - Calculated metrics
 */
function calculateMetrics(processes, connections) {
  const totalLeadTime = processes.reduce(
    (sum, process) => sum + (process.metrics.cycleTime || 0),
    0
  );
  
  const totalValueAddedTime = processes.reduce(
    (sum, process) => sum + (process.metrics.processTime || 0),
    0
  );
  
  const valueAddedRatio = totalLeadTime > 0
    ? totalValueAddedTime / totalLeadTime
    : 0;
  
  return {
    totalLeadTime,
    totalValueAddedTime,
    valueAddedRatio
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
