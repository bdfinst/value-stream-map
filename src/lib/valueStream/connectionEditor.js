/**
 * Validates a connection to ensure it has valid source and target
 * @param {Object} connection - The connection to validate
 * @returns {Object} - Validation result with isValid flag and errors object
 */
function validateConnection(connection) {
  const errors = {};
  
  // Validate source process
  if (!connection.sourceId) {
    errors.sourceId = 'Source process is required';
  }
  
  // Validate target process
  if (!connection.targetId) {
    errors.targetId = 'Target process is required';
  } else if (connection.targetId === connection.sourceId) {
    errors.targetId = 'Target must be different from source';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Checks if a connection already exists between two processes
 * @param {Array} connections - Existing connections
 * @param {string} sourceId - Source process ID
 * @param {string} targetId - Target process ID
 * @returns {boolean} - True if connection exists
 */
function connectionExists(connections, sourceId, targetId) {
  return connections.some(conn => 
    conn.sourceId === sourceId && conn.targetId === targetId
  );
}

export { validateConnection, connectionExists };