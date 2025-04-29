import processBlock from './processBlock.js';

/**
 * Applies a drag operation to a process block, updating its position
 * @param {Object} process - The process block to update
 * @param {Object} delta - The drag delta
 * @param {number} delta.dx - The x delta
 * @param {number} delta.dy - The y delta
 * @returns {Object} - Updated process block with new position
 */
function applyDragToProcess(process, { dx, dy }) {
	return processBlock.update(process, {
		position: {
			x: process.position.x + dx,
			y: process.position.y + dy
		}
	});
}

/**
 * Creates a D3 drag behavior for process blocks
 * @param {Object} d3 - D3 library instance
 * @param {Function} onDragEnd - Callback function when drag ends
 * @param {number} [blockHeight=80] - Height of process blocks
 * @param {number} [blockWidth=120] - Width of process blocks
 * @param {Array} [connections=[]] - All connections in the VSM
 * @param {Array} [processes=[]] - All processes in the VSM
 * @returns {Object} - D3 drag behavior
 */
function createProcessDragBehavior(
	d3,
	onDragEnd,
	blockHeight = 80,
	blockWidth = 120,
	connections = [],
	processes = []
) {
	// Function to update connection paths when a process moves
	function updateConnectionsDuringDrag(processId, newX, newY) {
		// Create a lookup to get process by ID
		const processMap = {};
		processes.forEach((p) => {
			processMap[p.id] = { ...p };
		});

		// Update the dragged process position in our temporary map
		if (processMap[processId]) {
			processMap[processId].position = { x: newX, y: newY };
		}

		// Helper to get connection points
		const getConnectionPoints = (connection) => {
			const source = processMap[connection.sourceId];
			const target = processMap[connection.targetId];

			if (!source || !target) return null;

			// Calculate exit and entry points (center of right and left sides)
			const sourceX = source.position.x + blockWidth;
			const sourceY = source.position.y + blockHeight / 2;
			const targetX = target.position.x;
			const targetY = target.position.y + blockHeight / 2;

			return { sourceX, sourceY, targetX, targetY };
		};

		// Update all connections that involve this process
		connections.forEach((connection) => {
			// Skip if this process is not part of the connection
			if (connection.sourceId !== processId && connection.targetId !== processId) {
				return;
			}

			const points = getConnectionPoints(connection);
			if (!points) return;

			const { sourceX, sourceY, targetX, targetY } = points;

			// Generate path points with a curve
			const pathPoints = [
				[sourceX, sourceY],
				[sourceX + (targetX - sourceX) / 2, sourceY],
				[targetX - (targetX - sourceX) / 2, targetY],
				[targetX, targetY]
			];

			// Update the path
			const lineGenerator = d3.line().curve(d3.curveBasis);
			d3.select(`.connection[data-id="${connection.id}"] path`).attr(
				'd',
				lineGenerator(pathPoints)
			);

			// Update connection endpoint position if this is the source
			if (connection.sourceId === processId) {
				d3.select(`.connection[data-id="${connection.id}"] .endpoint-group .endpoint`)
					.attr('cx', targetX)
					.attr('cy', targetY);
			}
		});
	}

	return d3
		.drag()
		.on('start', function (event, d) {
			// Store the starting position for reference
			this.__startPos = { x: d.position.x, y: d.position.y };
			this.__totalDx = 0;
			this.__totalDy = 0;
		})
		.on('drag', function (event, d) {
			// Update total delta
			this.__totalDx += event.dx;
			this.__totalDy += event.dy;

			// Calculate new position
			const newX = this.__startPos.x + this.__totalDx;
			const newY = this.__startPos.y + this.__totalDy;

			// Update visual position of process block during drag
			d3.select(this).attr('transform', `translate(${newX}, ${newY})`);

			// Also update the metrics box that belongs to this process
			const processId = d.id;

			// Use the blockHeight parameter for accurate positioning
			const metricsOffset = blockHeight + 5; // 5px gap between process and metrics box

			d3.select(`.metrics[data-process-id="${processId}"]`).attr(
				'transform',
				`translate(${newX}, ${newY + metricsOffset})`
			);

			// Update connections during drag for smooth visual feedback
			updateConnectionsDuringDrag(processId, newX, newY);
		})
		.on('end', function (event, d) {
			if (this.__totalDx === 0 && this.__totalDy === 0) return;

			// Create a new process object with the updated position
			const updatedProcess = {
				...d,
				position: {
					x: this.__startPos.x + this.__totalDx,
					y: this.__startPos.y + this.__totalDy
				}
			};

			// Call the callback with the updated process
			onDragEnd(updatedProcess);

			// Clean up
			delete this.__startPos;
			delete this.__totalDx;
			delete this.__totalDy;
		});
}

export { createProcessDragBehavior, applyDragToProcess };
