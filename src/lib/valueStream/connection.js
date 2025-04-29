/**
 * @typedef {Object} Connection
 * @property {string} id - Unique identifier for the connection
 * @property {string} sourceId - ID of the source process
 * @property {string} targetId - ID of the target process
 * @property {Array<Array<number>>} path - Control points for connection path [[x1,y1], [x2,y2], ...]
 */

/**
 * Creates a new connection between processes
 * @param {Object} params - Connection parameters
 * @param {string} params.id - Unique identifier
 * @param {string} params.sourceId - Source process ID
 * @param {string} params.targetId - Target process ID
 * @param {Array<Array<number>>} [params.path] - Path control points
 * @returns {Connection} - New connection
 */
function createConnection({
  id,
  sourceId,
  targetId,
  path = []
}) {
  return {
    id,
    sourceId,
    targetId,
    path: [...path]
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
  
  return updatedConnection;
}

export default {
  create: createConnection,
  update: updateConnection
};
