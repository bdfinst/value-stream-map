import processBlock from './processBlock.js';

/**
 * Applies a drag operation to a process block
 * @param {import('./processBlock').ProcessBlock} process - Process to update
 * @param {Object} delta - Position delta
 * @param {number} delta.dx - X-axis delta
 * @param {number} delta.dy - Y-axis delta
 * @returns {import('./processBlock').ProcessBlock} - Updated process with new position
 */
function applyDragToProcess(process, { dx, dy }) {
  // Calculate new position
  const newPosition = {
    x: process.position.x + dx,
    y: process.position.y + dy
  };
  
  // Update the process with the new position (immutably)
  return processBlock.update(process, {
    position: newPosition
  });
}

/**
 * Creates a D3 drag behavior for process blocks
 * @param {Function} onDragEnd - Callback function when drag ends
 * @returns {Object} - D3 drag behavior
 */
function createProcessDragBehavior(d3, onDragEnd) {
  return d3.drag()
    .on('drag', function(event, d) {
      // Update visual position during drag
      d3.select(this)
        .attr('transform', `translate(${d.position.x + event.dx}, ${d.position.y + event.dy})`);
    })
    .on('end', function(event, d) {
      if (event.dx === 0 && event.dy === 0) return;
      
      // Apply the final position update
      const updatedProcess = applyDragToProcess(d, {
        dx: event.dx,
        dy: event.dy
      });
      
      // Call the callback with the updated process
      onDragEnd(updatedProcess);
    });
}

export { applyDragToProcess, createProcessDragBehavior };