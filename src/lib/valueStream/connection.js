/**
 * @typedef {Object} ConnectionMetrics
 * @property {number} transferTime - Time to transfer between processes
 * @property {number} batchSize - Number of units transferred at once
 */

/**
 * @typedef {Object} Connection
 * @property {string} id - Unique identifier for the connection
 * @property {string} sourceId - ID of the source process
 * @property {string} targetId - ID of the target process
 * @property {Array<Array<number>>} path - Control points for connection path [[x1,y1], [x2,y2], ...]
 * @property {ConnectionMetrics} metrics - Connection-related metrics
 */

/**
 * Creates a new connection between processes
 * @param {Object} params - Connection parameters
 * @param {string} params.id - Unique identifier
 * @param {string} params.sourceId - Source process ID
 * @param {string} params.targetId - Target process ID
 * @param {Array<Array<number>>} [params.path] - Path control points
 * @param {Object} [params.metrics] - Connection metrics
 * @param {number} [params.metrics.transferTime=0] - Transfer time
 * @param {number} [params.metrics.batchSize=1] - Batch size
 * @returns {Connection} - New connection
 */
function createConnection({
  id,
  sourceId,
  targetId,
  path = [],
  metrics = { transferTime: 0, batchSize: 1 }
}) {
  return {
    id,
    sourceId,
    targetId,
    path: [...path],
    metrics: { ...metrics }
  };
}

/**
 * Updates an existing connection
 * @param {Connection} connection - Existing connection to update
 * @param {Object} updates - Properties to update
 * @returns {Connection} - Updated connection (new instance)
 */
function updateConnection(connection, updates) {
  const updatedConnection = {
    ...connection,
    ...updates
  };
  
  // If path is being updated, ensure it's a new array
  if (updates.path) {
    updatedConnection.path = [...updates.path];
  }
  
  // If metrics are being updated, ensure it's a new object that preserves existing metrics
  if (updates.metrics) {
    updatedConnection.metrics = { ...connection.metrics, ...updates.metrics };
  }
  
  return updatedConnection;
}

export default {
  create: createConnection,
  update: updateConnection
};
