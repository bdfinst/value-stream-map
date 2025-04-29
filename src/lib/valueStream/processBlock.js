/**
 * @typedef {Object} ProcessMetrics
 * @property {number} processTime - Time required to process a single unit
 * @property {number} [cycleTime] - Total time (process time + incoming wait time)
 * @property {number} [reworkCycleTime] - Additional time when rework is needed
 * @property {number} [completeAccurate] - Percentage of output that is complete and accurate (0-100)
 */

/**
 * @typedef {Object} ProcessBlock
 * @property {string} id - Unique identifier for the process
 * @property {string} name - Display name for the process
 * @property {string} [description] - Detailed description of the process
 * @property {{x: number, y: number}} position - Position coordinates
 * @property {ProcessMetrics} metrics - Process-related metrics
 */

/**
 * Creates a new process block for the value stream map
 * @param {Object} params - Process parameters
 * @param {string} params.id - Unique identifier for the process
 * @param {string} params.name - Display name for the process
 * @param {string} [params.description] - Detailed description
 * @param {Object} [params.position] - Position coordinates
 * @param {number} [params.position.x=0] - X coordinate
 * @param {number} [params.position.y=0] - Y coordinate
 * @param {Object} [params.metrics] - Process metrics
 * @param {number} [params.metrics.processTime=0] - Process time
 * @returns {ProcessBlock} - New process block
 */
function createProcessBlock({
  id,
  name,
  description = '',
  position = { x: 0, y: 0 },
  metrics = { processTime: 0, completeAccurate: 100 }
}) {
  return {
    id,
    name,
    description,
    position: { ...position },
    metrics: { 
      ...metrics,
      processTime: metrics.processTime || 0,
      completeAccurate: metrics.completeAccurate !== undefined ? metrics.completeAccurate : 100,
      cycleTime: (metrics.processTime || 0)
    }
  };
}

/**
 * Updates an existing process block
 * @param {ProcessBlock} process - Existing process block to update
 * @param {Object} updates - Properties to update
 * @returns {ProcessBlock} - Updated process block (new instance)
 */
function updateProcessBlock(process, updates) {
  const updatedProcess = {
    ...process,
    ...updates
  };
  
  // If position is being updated, ensure it's a new object
  if (updates.position) {
    updatedProcess.position = { ...updatedProcess.position, ...updates.position };
  }
  
  // If metrics are being updated, ensure it's a new object and recalculate derived values
  if (updates.metrics) {
    // Create a new metrics object that preserves all existing metrics and adds/updates new ones
    updatedProcess.metrics = { ...process.metrics, ...updates.metrics };
    
    // Ensure completeAccurate is set (default to 100%)
    if (updatedProcess.metrics.completeAccurate === undefined) {
      updatedProcess.metrics.completeAccurate = 100;
    }
    
    // Cycle time is just the process time now (wait time added in renderer)
    updatedProcess.metrics.cycleTime = (updatedProcess.metrics.processTime || 0);
  }
  
  return updatedProcess;
}

export default {
  create: createProcessBlock,
  update: updateProcessBlock
};
