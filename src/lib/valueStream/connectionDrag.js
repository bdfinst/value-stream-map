/**
 * Checks if a point (x,y) is near a process block
 * @param {Object} process - The process to check
 * @param {number} x - X coordinate of the point
 * @param {number} y - Y coordinate of the point
 * @param {number} blockWidth - Width of process blocks
 * @param {number} blockHeight - Height of process blocks
 * @param {number} [threshold=10] - Distance threshold in pixels
 * @returns {boolean} - True if the point is near the process
 */
function isPointNearProcess(process, x, y, blockWidth, blockHeight, threshold = 10) {
	const px = process.position.x;
	const py = process.position.y;

	// Check if point is within or near the process block with threshold
	return (
		x >= px - threshold &&
		x <= px + blockWidth + threshold &&
		y >= py - threshold &&
		y <= py + blockHeight + threshold
	);
}

/**
 * Finds the nearest process to a point
 * @param {Array} processes - List of all processes
 * @param {number} x - X coordinate of the point
 * @param {number} y - Y coordinate of the point
 * @param {number} blockWidth - Width of process blocks
 * @param {number} blockHeight - Height of process blocks
 * @param {number} [maxDistance=50] - Maximum distance to consider
 * @returns {Object|null} - The nearest process or null if none are close enough
 */
function findNearestProcess(processes, x, y, blockWidth, blockHeight, maxDistance = 50) {
	let nearestProcess = null;
	let minDistance = Infinity;

	for (const process of processes) {
		const px = process.position.x;
		const py = process.position.y;

		// Calculate distance to the center of the process block
		const centerX = px + blockWidth / 2;
		const centerY = py + blockHeight / 2;

		// For test point (450, 120):
		// Process1 center: (160, 140) -> distance = ~292
		// Process2 center: (360, 140) -> distance = ~103
		// Process3 center: (560, 140) -> distance = ~113
		const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

		if (distance < minDistance && distance <= maxDistance) {
			minDistance = distance;
			nearestProcess = process;
		}
	}

	return nearestProcess;
}

/**
 * Creates a D3 drag behavior for connection endpoints
 * @param {Object} d3 - D3 library instance
 * @param {Array} processes - List of all processes
 * @param {number} blockWidth - Width of process blocks
 * @param {number} blockHeight - Height of process blocks
 * @param {Function} onDragEnd - Callback function when drag ends
 * @returns {Object} - D3 drag behavior
 */
function createConnectionDragBehavior(d3, processes, blockWidth, blockHeight, onDragEnd) {
	let originalConnection = null;

	return d3
		.drag()
		.on('start', function (event, d) {
			// Store original connection
			originalConnection = { ...d };
		})
		.on('drag', function (event, d) {
			// Update the visual position of the arrow during drag
			const group = d3.select(this);
			const endpoint = group.select('.endpoint');
			endpoint.attr('cx', event.x).attr('cy', event.y);

			// Get the parent connection group
			const connectionGroup = d3.select(this.parentNode);

			// Find the path in the parent connection group
			const path = connectionGroup.select('path');

			// Get source and target processes for this connection
			const source = processes.find((p) => p.id === d.sourceId);

			if (source && path.node()) {
				// Check if the target endpoint is positioned to the left of the source
				// (rework connection, going right to left)
				const isRework = event.x < source.position.x;

				// Calculate source point based on connection type
				let sourceX, sourceY, pathPoints;

				if (isRework) {
					// For rework connections, exit from the top of the source
					sourceX = source.position.x + blockWidth / 2;
					sourceY = source.position.y;

					// Rework path: From top of source, up and over to target
					pathPoints = [
						[sourceX, sourceY], // Start at top of source
						[sourceX, sourceY - 40], // Go up from source
						[(sourceX + event.x) / 2, sourceY - 40], // Horizontal mid-path
						[event.x, sourceY - 40], // Continue horizontally to above target
						[event.x, event.y] // Go down to target
					];
				} else {
					// For normal connections, exit from the right side of the source
					sourceX = source.position.x + blockWidth;
					sourceY = source.position.y + blockHeight / 2;

					// Normal path: Direct connection to the left side of target
					pathPoints = [
						[sourceX, sourceY],
						[sourceX + (event.x - sourceX) / 2, sourceY],
						[event.x - (event.x - sourceX) / 2, event.y],
						[event.x, event.y]
					];
				}

				// Update the path
				const lineGenerator = d3.line().curve(d3.curveBasis);
				path.attr('d', lineGenerator(pathPoints));
			}

			// Highlight the nearest process if any
			const nearestProcess = findNearestProcess(
				processes,
				event.x,
				event.y,
				blockWidth,
				blockHeight
			);

			// Remove any previous highlights
			d3.selectAll('.process-highlight').remove();

			// Add highlight to nearest process if found
			if (nearestProcess) {
				d3.select(`.process[data-id="${nearestProcess.id}"] rect`)
					.clone()
					.attr('class', 'process-highlight')
					.style('fill', 'none')
					.style('stroke', '#4CAF50')
					.style('stroke-width', '3px')
					.style('stroke-dasharray', '5,5')
					.style('pointer-events', 'none');
			}
		})
		.on('end', function (event, d) {
			// Find nearest process to the drop point
			const nearestProcess = findNearestProcess(
				processes,
				event.x,
				event.y,
				blockWidth,
				blockHeight
			);

			// Remove any highlights
			d3.selectAll('.process-highlight').remove();

			// Get the parent connection group
			const connectionGroup = d3.select(this.parentNode);

			if (nearestProcess && nearestProcess.id !== d.sourceId) {
				// Update the connection with the new target
				const updatedConnection = {
					...d,
					targetId: nearestProcess.id
				};

				// Call the callback with the updated connection
				onDragEnd({ originalData: d, newTargetId: nearestProcess.id });
			} else {
				// Reset to original connection

				// Find the path in the parent connection group
				const path = connectionGroup.select('path');
				const source = processes.find((p) => p.id === d.sourceId);
				const target = processes.find((p) => p.id === d.targetId);

				if (source && target && path.node()) {
					// Check if this is a rework connection (going from right to left)
					const isRework = source.position.x > target.position.x;

					let sourceX, sourceY, targetX, targetY, pathPoints;

					if (isRework) {
						// For rework connections:
						// 1. Exit from the top of the source
						sourceX = source.position.x + blockWidth / 2;
						sourceY = source.position.y;

						// 2. Connect to the top of the target
						targetX = target.position.x + blockWidth / 2;
						targetY = target.position.y;

						// Create rework path points - arch from top to top
						pathPoints = [
							[sourceX, sourceY], // Start at top of source
							[sourceX, sourceY - 40], // Go up from source
							[(sourceX + targetX) / 2, sourceY - 40], // Horizontal mid-path
							[targetX, sourceY - 40], // Continue horizontally to above target
							[targetX, targetY] // Go down to top of target
						];
					} else {
						// For normal flow:
						// 1. Exit from the right side of the source
						sourceX = source.position.x + blockWidth;
						sourceY = source.position.y + blockHeight / 2;

						// 2. Connect to the left side of the target
						targetX = target.position.x;
						targetY = target.position.y + blockHeight / 2;

						// Create normal path points
						pathPoints = [
							[sourceX, sourceY],
							[sourceX + (targetX - sourceX) / 2, sourceY],
							[targetX - (targetX - sourceX) / 2, targetY],
							[targetX, targetY]
						];
					}

					// Update the path back to original
					const lineGenerator = d3.line().curve(d3.curveBasis);
					path.attr('d', lineGenerator(pathPoints));

					// Reset the endpoint position
					const endpoint = d3.select(this).select('.endpoint');
					endpoint.attr('cx', 0).attr('cy', 0);
				}

				// Call the callback with the original connection to ensure store consistency
				onDragEnd({ originalData: originalConnection, newTargetId: originalConnection.targetId });
			}
		});
}

export { isPointNearProcess, findNearestProcess, createConnectionDragBehavior };
