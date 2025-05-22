// External imports
import * as d3 from 'd3';

// Internal imports
import { formatDecimal } from '../utils/formatters.js';

// Relative imports
import { createConnectionDragBehavior } from './connectionDrag.js';
import { createProcessDragBehavior } from './draggable.js';
import processIndicators from './processIndicators.js';
import connectionUI from './connectionUI.js';

/**
 * @typedef {import('./processBlock').ProcessBlock} ProcessBlock
 * @typedef {import('./connection').Connection} Connection
 * @typedef {import('./createVSM').ValueStreamMap} ValueStreamMap
 */

/**
 * Renders a Value Stream Map to an SVG container using D3
 * @param {Object} params - Render parameters
 * @param {HTMLElement} params.container - DOM element to render into
 * @param {ValueStreamMap} params.vsm - Value Stream Map to render
 * @param {Object} [params.options] - Rendering options
 * @param {number} [params.options.width=800] - SVG width
 * @param {number} [params.options.height=600] - SVG height
 * @param {number} [params.options.blockWidth=120] - Process block width
 * @param {number} [params.options.blockHeight=80] - Process block height
 * @param {Function} [params.options.onBlockClick] - Process block click handler (for selection)
 * @param {Function} [params.options.onBlockEdit] - Process block edit handler (for editing)
 * @param {Function} [params.options.onBlockDrag] - Process block drag handler
 * @param {Function} [params.options.onConnectionClick] - Connection click handler (for selection)
 * @param {Function} [params.options.onConnectionEdit] - Connection edit handler (for editing)
 * @param {Function} [params.options.onConnectionDrag] - Connection endpoint drag handler
 * @param {Function} [params.options.onZoomFit] - Callback when zoom fit is requested
 * @returns {Object} - D3 selection of the rendered SVG and zoom controller
 */
function renderVSM({ container, vsm, options = {} }) {
	const {
		width = 800,
		height = 600,
		blockWidth = 120,
		blockHeight = 80,
		onBlockClick = () => {},
		onBlockEdit = null,
		onBlockDrag = null,
		onConnectionClick = null,
		onConnectionEdit = null,
		onConnectionDrag = null
	} = options;

	// Clear the container
	d3.select(container).selectAll('*').remove();

	// Get the actual dimensions of the container
	const containerRect = container.getBoundingClientRect();
	const containerWidth = Math.max(containerRect.width || width, 200);
	const containerHeight = Math.max(containerRect.height || height, 200);

	// Adjust viewBox to maintain aspect ratio based on container size
	const viewBoxWidth = containerWidth;
	const viewBoxHeight = containerHeight;

	// Create SVG container with zoom behavior and responsive sizing
	const svg = d3
		.select(container)
		.append('svg')
		.attr('width', '100%')
		.attr('height', '100%')
		.attr('viewBox', `0 0 ${viewBoxWidth} ${viewBoxHeight}`)
		.attr('preserveAspectRatio', 'xMidYMid meet')
		.attr('class', 'vsm-container');

	// Create a group for zoom/pan behavior
	const g = svg.append('g').attr('class', 'vsm-content');

	// Add zoom behavior
	const zoom = d3
		.zoom()
		.scaleExtent([0.1, 4])
		.on('zoom', (event) => {
			g.attr('transform', event.transform);
		});

	svg.call(zoom);

	// Create groups for different elements
	const connectionsGroup = g.append('g').attr('class', 'connections');
	const processesGroup = g.append('g').attr('class', 'processes');
	const labelsGroup = g.append('g').attr('class', 'labels');

	// Function to zoom to fit all elements
	function zoomToFit(duration = 750) {
		// Get all processes to calculate the bounds
		if (vsm.processes.length === 0) return;

		// Calculate bounds based on process positions and sizes
		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;

		// Consider all processes for bounds calculation
		vsm.processes.forEach((process) => {
			const x = process.position.x;
			const y = process.position.y;

			minX = Math.min(minX, x);
			minY = Math.min(minY, y);
			maxX = Math.max(maxX, x + blockWidth);
			maxY = Math.max(maxY, y + blockHeight + 60); // Include metrics box with more space
		});

		// Consider connection paths for bounds
		vsm.connections.forEach((connection) => {
			// Check if this has a rework path that might extend beyond the processes
			if (connection.isRework && connection.path && connection.path.length > 0) {
				connection.path.forEach((point) => {
					minX = Math.min(minX, point[0]);
					minY = Math.min(minY, point[1]);
					maxX = Math.max(maxX, point[0]);
					maxY = Math.max(maxY, point[1]);
				});
			}
		});

		// Add padding
		const padding = 60; // Increased padding
		minX -= padding;
		minY -= padding;
		maxX += padding;
		maxY += padding;

		// Calculate bounds
		const dx = maxX - minX;
		const dy = maxY - minY;
		const x = minX;
		const y = minY;

		// Get actual container dimensions - make sure we use the current size
		const containerRect = container.getBoundingClientRect();
		const containerWidth = Math.max(containerRect.width, 200); // Ensure minimum width
		const containerHeight = Math.max(containerRect.height, 200); // Ensure minimum height

		// Calculate scale to fit the entire diagram
		// Use 0.95 instead of 0.9 to fill more of the canvas
		const scale = Math.min((0.95 * containerWidth) / dx, (0.95 * containerHeight) / dy);

		// Calculate translate values to center the diagram
		const translateX = containerWidth / 2 - scale * (x + dx / 2);
		const translateY = containerHeight / 2 - scale * (y + dy / 2);

		// Log dimensions for debugging
		console.log('Zoom bounds:', { minX, minY, maxX, maxY, dx, dy });
		console.log('Container size:', { containerWidth, containerHeight });
		console.log('Zoom transform:', { translateX, translateY, scale });

		// Apply zoom transform
		svg
			.transition()
			.duration(duration)
			.call(zoom.transform, d3.zoomIdentity.translate(translateX, translateY).scale(scale));
	}

	// No internal zoom controls - using external controls only

	// Render connections first (so they appear behind processes)
	renderConnections(connectionsGroup, vsm.connections, vsm.processes, {
		blockWidth,
		blockHeight,
		onClick: onConnectionClick,
		onEditClick: onConnectionEdit,
		onDragEnd: onConnectionDrag,
		processes: vsm.processes
	});

	// Render process blocks
	renderProcessBlocks(processesGroup, vsm.processes, {
		blockWidth,
		blockHeight,
		onClick: onBlockClick,
		onEditClick: onBlockEdit,
		onDragEnd: onBlockDrag,
		connections: vsm.connections,
		processes: vsm.processes
	});

	// Render metrics labels with connections for wait time calculation
	renderMetricsLabels(labelsGroup, vsm.processes, vsm.connections, { blockWidth, blockHeight });

	// Automatically zoom to fit when first rendering
	zoomToFit(0); // No animation on initial render

	// Return SVG and zoom controller
	return {
		svg,
		zoomFit: () => zoomToFit(),
		zoomIn: () => svg.call(zoom.scaleBy, 1.3),
		zoomOut: () => svg.call(zoom.scaleBy, 0.7)
	};
}

/**
 * Renders process blocks using D3
 * @param {Object} group - D3 selection for the group to render into
 * @param {Array<ProcessBlock>} processes - Process blocks to render
 * @param {Object} options - Rendering options
 * @param {number} options.blockWidth - Width of process blocks
 * @param {number} options.blockHeight - Height of process blocks
 * @param {Function} [options.onClick] - Process block click handler for selection
 * @param {Function} [options.onEditClick] - Process block edit handler
 * @param {Function} [options.onDragEnd] - Process block drag handler
 * @param {Array<Connection>} [options.connections] - Connections for reference
 * @param {Array<ProcessBlock>} [options.processes] - Processes for reference
 */
function renderProcessBlocks(group, processes, options) {
	const { blockWidth, blockHeight, onClick, onEditClick, onDragEnd } = options;
	const allConnections = options.connections || [];

	// Create process block groups
	const processGroups = group
		.selectAll('.process')
		.data(processes, (d) => d.id)
		.enter()
		.append('g')
		.attr('class', (d) => {
			// Add flow-status classes (first/last)
			const statusClasses = processIndicators.getProcessStatusClasses(d.id, allConnections);
			return `process ${statusClasses}`;
		})
		.attr('data-id', (d) => d.id) // Add data-id attribute for selection by ID
		.attr('transform', (d) => `translate(${d.position.x}, ${d.position.y})`)
		.style('cursor', 'grab');

	// Apply drag behavior if provided
	if (onDragEnd) {
		const allProcesses = options.processes || [];

		processGroups.call(
			createProcessDragBehavior(
				d3,
				onDragEnd,
				blockHeight,
				blockWidth,
				allConnections,
				allProcesses
			)
		);
	}

	// Add process rectangles with visual indicators for flow status
	processGroups
		.append('rect')
		.attr('width', blockWidth)
		.attr('height', blockHeight)
		.attr('rx', 4)
		.attr('ry', 4)
		.attr('class', 'process-block')
		.style('fill', (d) => {
			// Use the visual attributes service to get styling
			const attrs = processIndicators.getProcessVisualAttributes(d.id, allConnections);
			return attrs.fillColor;
		})
		.style('stroke', (d) => {
			// Use the visual attributes service to get styling
			const attrs = processIndicators.getProcessVisualAttributes(d.id, allConnections);
			return attrs.stroke;
		})
		.style('stroke-width', (d) => {
			// Use the visual attributes service to get styling
			const attrs = processIndicators.getProcessVisualAttributes(d.id, allConnections);
			return attrs.strokeWidth;
		})
		.on('click', (event, d) => {
			// Toggle selection on block click
			onClick(d);
		});

	// Add process names with text wrapping
	processGroups
		.append('foreignObject')
		.attr('x', 10) // Add padding
		.attr('y', 10)
		.attr('width', blockWidth - 20) // Subtract padding and leave space for edit button
		.attr('height', blockHeight - 20)
		.append('xhtml:div')
		.attr('class', 'process-name-container w-full h-full flex items-center justify-center')
		.style('font-weight', 'bold')
		.style('font-size', '14px')
		.style('text-align', 'center')
		.style('word-wrap', 'break-word')
		.style('line-height', '1.2')
		.style('overflow', 'hidden')
		.text((d) => d.name);

	// Add edit button with Font Awesome (positioned in top-right corner)
	const editGroup = processGroups
		.append('foreignObject')
		.attr('class', 'edit-button')
		.attr('x', blockWidth - 28)
		.attr('y', 2)
		.attr('width', 24)
		.attr('height', 24)
		.style('cursor', 'pointer')
		.on('click', (event, d) => {
			event.stopPropagation(); // Prevent triggering block click

			// Use the dedicated edit handler if available
			if (onEditClick) {
				onEditClick(d);
			} else if (onClick) {
				// Fallback to onClick with 'edit' action if no dedicated handler
				onClick(d, 'edit');
			}
		});

	// Add Font Awesome edit icon using HTML
	editGroup
		.append('xhtml:div')
		.attr('class', 'fa-container w-full h-full flex items-center justify-center')
		.html('<i class="fas fa-cog text-gray-600 hover:text-blue-500 text-lg"></i>');

	// Add status indicators
	processGroups.each(function (d) {
		const node = d3.select(this);
		const attrs = processIndicators.getProcessVisualAttributes(d.id, allConnections);

		// Only add indicators for first, last, or both
		if (attrs.indicator) {
			let iconHtml = '';
			let iconColor = '';
			let title = '';

			// Determine which icon to show based on status
			switch (attrs.indicator) {
				case 'first':
					iconHtml = '<i class="fas fa-play-circle"></i>';
					iconColor = 'text-green-600';
					title = 'First Step';
					break;
				case 'last':
					iconHtml = '<i class="fas fa-flag-checkered"></i>';
					iconColor = 'text-blue-600';
					title = 'Last Step';
					break;
				case 'first-last':
					iconHtml = '<i class="fas fa-circle"></i>';
					iconColor = 'text-purple-600';
					title = 'First & Last Step';
					break;
			}

			// Add the indicator with appropriate positioning
			node
				.append('foreignObject')
				.attr('class', 'process-indicator')
				.attr('x', blockWidth - 28)
				.attr('y', blockHeight - 26)
				.attr('width', 24)
				.attr('height', 24)
				.append('xhtml:div')
				.attr(
					'class',
					`indicator-container w-full h-full flex items-center justify-center ${iconColor}`
				)
				.attr('title', title)
				.html(iconHtml);
		}
	});
}

/**
 * Renders connections between processes using D3's general update pattern.
 * @param {Object} group - D3 selection for the group to render into
 * @param {Array<Connection>} connections - Connections to render
 * @param {Array<ProcessBlock>} processes - Process blocks for reference
 * @param {Object} options - Rendering options
 * @param {number} options.blockWidth - Width of process blocks
 * @param {number} options.blockHeight - Height of process blocks
 * @param {Function} [options.onClick] - Connection click handler for selection
 * @param {Function} [options.onEditClick] - Connection edit handler
 * @param {Function} [options.onDragEnd] - Connection drag handler
 * @param {Array<ProcessBlock>} [options.processes] - Processes for reference (allProcesses)
 */
function renderConnections(group, connections, processes, options) {
	const {
		blockWidth,
		blockHeight,
		onClick,
		onEditClick,
		onDragEnd,
		processes: allProcesses // Renamed for clarity inside function
	} = options;

	// Create a lookup map for processes by ID for quick access
	const processMap = new Map(processes.map((p) => [p.id, p]));

	// Helper to calculate connection points
	const getConnectionPoints = (connection) => {
		const source = processMap.get(connection.sourceId);
		const target = processMap.get(connection.targetId);

		if (!source || !target) return null;

		const isReworkConnection = connection.isRework || source.position.x > target.position.x;
		let sourceX, sourceY, targetX, targetY;

		if (isReworkConnection) {
			sourceX = source.position.x + blockWidth / 2;
			sourceY = source.position.y;
			targetX = target.position.x + blockWidth / 2;
			targetY = target.position.y;
		} else {
			sourceX = source.position.x + blockWidth;
			sourceY = source.position.y + blockHeight / 2;
			targetX = target.position.x;
			targetY = target.position.y + blockHeight / 2;
		}
		return { sourceX, sourceY, targetX, targetY, isReworkConnection };
	};

	const lineGenerator = d3.line().curve(d3.curveBasis);

	// Data join for connection groups
	const connectionGroups = group
		.selectAll('g.connection') // Select by specific class and tag
		.data(connections, (d) => d.id);

	// Exit selection: Remove old connection groups
	connectionGroups.exit().remove();

	// Enter selection: Create new connection groups
	const enterGroups = connectionGroups
		.enter()
		.append('g')
		.attr('class', 'connection') // Apply class immediately
		.style('cursor', onClick ? 'pointer' : 'default');

	// Add click handler to new groups if onClick is provided
	if (onClick) {
		// Apply to enter selection only, as merge below might re-add if not careful
		enterGroups.on('click', (event, d) => onClick(d));
	}
	
	// Merge enter and update selections
	const mergedGroups = enterGroups.merge(connectionGroups);

	// Update attributes for all groups (new and existing)
	mergedGroups
		.attr('data-id', (d) => d.id)
		.attr('data-source-id', (d) => d.sourceId)
		.attr('data-target-id', (d) => d.targetId);
	
	// Apply changes to each connection group (new or updated)
	mergedGroups.each(function (d) { // 'd' is the connection data for this group
		const groupElement = d3.select(this); // 'this' is the <g class="connection"> element

		// Update tooltip (applied to merged selection)
		const shouldShowTooltip = connectionUI.shouldShowTooltip(d);
		if (shouldShowTooltip) {
			groupElement.attr('data-tooltip', 'true').attr('title', connectionUI.getConnectionTooltip(d, processes));
		} else {
			groupElement.attr('data-tooltip', null).attr('title', null);
		}

		const points = getConnectionPoints(d);
		if (!points) {
			groupElement.remove(); // Or hide, if preferred
			return;
		}
		const { sourceX, sourceY, targetX, targetY, isReworkConnection } = points;

		let pathPoints;
		const recommendedPath = connectionUI.getRecommendedPath(d.sourceId, d.targetId, processes, connections);
		if (recommendedPath && recommendedPath.length > 0) {
			pathPoints = recommendedPath;
		} else if (d.path && d.path.length > 0) {
			pathPoints = d.path;
		} else if (isReworkConnection) {
			const arcHeight = Math.min(80, Math.abs(sourceX - targetX) * 0.3);
			const midY = Math.min(sourceY, targetY) - arcHeight;
			const midX = (sourceX + targetX) / 2;
			pathPoints = [[sourceX, sourceY], [sourceX, sourceY - 30], [sourceX + (midX - sourceX) * 0.5, midY], [midX, midY], [targetX + (midX - targetX) * 0.5, midY], [targetX, targetY - 30], [targetX, targetY]];
		} else {
			pathPoints = [[sourceX, sourceY], [sourceX + (targetX - sourceX) / 2, sourceY], [targetX - (targetX - sourceX) / 2, targetY], [targetX, targetY]];
		}

		const visualAttrs = connectionUI.getConnectionVisualAttributes(d, processes);

		// Path: using .join() to handle enter/update/exit for the path element itself
		groupElement.selectAll('path.connection-line') // Specific class for the line path
			.data([d]) // Bind the connection data to the path
			.join('path')
			.attr('class', 'connection-line')
			.attr('d', lineGenerator(pathPoints))
			.attr('fill', 'none')
			.attr('stroke', visualAttrs.stroke)
			.attr('stroke-width', visualAttrs.strokeWidth)
			.attr('stroke-opacity', visualAttrs.strokeOpacity)
			.attr('marker-end', `url(#${visualAttrs.arrowMarker})`);

		// Draggable Endpoint
		if (onDragEnd) {
			const endpointData = [d]; // Data for the endpoint group/circle

			// Select or append the endpoint group
			const endpointGroup = groupElement.selectAll('g.endpoint-group')
				.data(endpointData)
				.join('g')
				.attr('class', 'endpoint-group');
				// No transform needed as cx/cy are absolute to the <g class="connection">
				
			// Select or append the circle within the endpoint group
			endpointGroup.selectAll('circle.endpoint')
				.data(endpointData) // Use endpointData here as well
				.join('circle')
				.attr('class', 'endpoint')
				.attr('cx', targetX)
				.attr('cy', targetY)
				.attr('r', 6)
				.style('fill', '#4CAF50')
				.style('stroke', '#fff')
				.style('stroke-width', 2)
				.style('cursor', 'move')
				.attr('data-rework', isReworkConnection ? 'true' : 'false')
				.call(createConnectionDragBehavior(d3, allProcesses, blockWidth, blockHeight, onDragEnd)); // Apply drag to the circle
		} else {
			groupElement.select('g.endpoint-group').remove(); // Remove if no drag handler
		}
		
		const midX = (sourceX + targetX) / 2;
		const midY = (sourceY + targetY) / 2;

		// Wait Time Label
		const hasWaitTime = d.metrics && d.metrics.waitTime !== undefined;
		const waitTimeLabelData = hasWaitTime ? [d] : [];

		groupElement.selectAll('g.wait-time-label')
			.data(waitTimeLabelData)
			.join(
				enter => {
					const gLabel = enter.append('g').attr('class', 'wait-time-label');
					gLabel.append('rect')
						.attr('class', 'label-bg') // Class for selection/update
						.attr('x', -40).attr('y', -12).attr('width', 80).attr('height', 24)
						.attr('rx', 12).attr('ry', 12).style('fill', 'white');
					gLabel.append('text')
						.attr('class', 'label-text') // Class for selection/update
						.attr('x', -10).attr('y', 5).attr('text-anchor', 'middle')
						.style('font-size', '11px').style('font-weight', 'bold');
					if (onEditClick || onClick) {
						const editButton = gLabel.append('foreignObject')
							.attr('class', 'connection-edit-wait-time') // Specific class
							.attr('x', 17).attr('y', -12).attr('width', 24).attr('height', 24)
							.style('cursor', 'pointer');
						editButton.append('xhtml:div')
							.attr('class', 'fa-container w-full h-full flex items-center justify-center')
							.html('<i class="fas fa-cog text-gray-600 hover:text-blue-500 text-sm"></i>');
					}
					return gLabel;
				},
				update => update, // No specific update needed for the <g> itself here, children are updated below
				exit => exit.remove()
			)
			.attr('transform', isReworkConnection ? `translate(${(sourceX + targetX) / 2}, ${Math.min(sourceY, targetY) - 80})` : `translate(${(sourceX + targetX) / 2}, ${(sourceY + targetY) / 2 - 20})`)
			.call(gLabel => { // Update children of the label group
				gLabel.select('rect.label-bg')
					.style('stroke', visualAttrs.stroke)
					.style('stroke-width', 1);
				gLabel.select('text.label-text')
					.style('fill', visualAttrs.stroke)
					.text(`WT: ${formatDecimal(d.metrics.waitTime)}`);
				gLabel.select('foreignObject.connection-edit-wait-time')
					.on('click', (event) => { // d is from parent .each()
						event.stopPropagation();
						if (onEditClick) onEditClick(d); else if (onClick) onClick(d, 'edit');
					});
			});

		// Floating Edit Button (if no wait time label)
		const showFloatingEdit = onClick && !hasWaitTime;
		const floatingEditData = showFloatingEdit ? [d] : [];

		groupElement.selectAll('foreignObject.connection-edit-floating')
			.data(floatingEditData)
			.join(
				enter => {
					const fo = enter.append('foreignObject')
						.attr('class', 'connection-edit-floating')
						.attr('width', 28).attr('height', 28).style('cursor', 'pointer');
					fo.append('xhtml:div')
						.attr('class', 'fa-container w-full h-full flex items-center justify-center')
						.html('<i class="fas fa-cog text-gray-600 hover:text-blue-500 text-lg bg-white rounded-full p-1"></i>');
					return fo;
				},
				update => update,
				exit => exit.remove()
			)
			.attr('x', midX - 14).attr('y', midY - 4)
			.on('click', (event) => { // d is from parent .each()
				event.stopPropagation();
				if (onEditClick) onEditClick(d); else if (onClick) onClick(d, 'edit');
			});
			
		// Rework Label
		const reworkLabelData = isReworkConnection ? [d] : [];
		groupElement.selectAll('g.rework-label')
			.data(reworkLabelData)
			.join(
				enter => {
					const gRework = enter.append('g').attr('class', 'rework-label');
					gRework.append('text')
						.attr('text-anchor', 'middle')
						.style('font-size', '10px').style('font-style', 'italic');
					return gRework;
				},
				update => update,
				exit => exit.remove()
			)
			.attr('transform', `translate(${(sourceX + targetX) / 2}, ${Math.min(sourceY, targetY) - 100})`)
			.select('text')
				.style('fill', visualAttrs.stroke)
				.text('Rework');
	});

	// Add arrow marker definitions to SVG (ensure they are defined once)
	let defs = d3.select(group.node().ownerSVGElement).select('defs');
	if (defs.empty()) {
		defs = d3.select(group.node().ownerSVGElement).append('defs');
	}

	if (defs.select('#arrow').empty()) {
		defs.append('marker')
			.attr('id', 'arrow')
			.attr('viewBox', '0 -5 10 10').attr('refX', 8).attr('refY', 0)
			.attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
			.append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#555');
	}
	if (defs.select('#arrow-red').empty()) {
		defs.append('marker')
			.attr('id', 'arrow-red')
			.attr('viewBox', '0 -5 10 10').attr('refX', 8).attr('refY', 0)
			.attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
			.append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#e53e3e');
	}
}

/**
 * Renders metrics labels for processes
 * @param {Object} group - D3 selection for the group to render into
 * @param {Array<ProcessBlock>} processes - Process blocks
 * @param {Array<Connection>} connections - Connections between processes
 * @param {Object} options - Rendering options
 */
function renderMetricsLabels(group, processes, connections, options) {
	const { blockWidth, blockHeight } = options;

	// Create a map of incoming connections to each process
	const incomingConnections = {};

	// Collect all incoming connections and their wait times
	connections.forEach((connection) => {
		if (!incomingConnections[connection.targetId]) {
			incomingConnections[connection.targetId] = [];
		}
		incomingConnections[connection.targetId].push(connection);
	});

	// Create metric box groups under each process
	const metricGroups = group
		.selectAll('.metrics')
		.data(processes, (d) => d.id)
		.enter()
		.append('g')
		.attr('class', 'metrics')
		.attr('data-process-id', (d) => d.id) // Add reference to process ID
		.attr('transform', (d) => `translate(${d.position.x}, ${d.position.y + blockHeight + 5})`);

	// Add metric boxes - make them larger to fit more metrics
	metricGroups
		.append('rect')
		.attr('width', blockWidth)
		.attr('height', 60)
		.attr('rx', 2)
		.attr('ry', 2)
		.style('fill', '#f8f8f8')
		.style('stroke', '#ddd')
		.style('stroke-width', 1);

	// Create separate maps for normal and rework connections
	const normalConnections = {};
	const reworkConnections = {};

	// Classify connections
	connections.forEach((conn) => {
		const isRework = conn.isRework;

		if (isRework) {
			if (!reworkConnections[conn.targetId]) {
				reworkConnections[conn.targetId] = [];
			}
			reworkConnections[conn.targetId].push(conn);
		} else {
			if (!normalConnections[conn.targetId]) {
				normalConnections[conn.targetId] = [];
			}
			normalConnections[conn.targetId].push(conn);
		}
	});

	// Add process time metric
	metricGroups
		.append('text')
		.attr('x', blockWidth / 2)
		.attr('y', 12)
		.attr('text-anchor', 'middle')
		.attr('class', 'metric-label')
		.style('font-size', '10px')
		.text((d) => `PT: ${formatDecimal(d.metrics.processTime || 0)}`);

	// Add %C/A metric (percentage complete and accurate) - only for non-last processes
	metricGroups
		.append('text')
		.attr('x', blockWidth / 2)
		.attr('y', 25)
		.attr('text-anchor', 'middle')
		.attr('class', 'metric-label')
		.style('font-size', '10px')
		.style('fill', (d) => {
			const ca = d.metrics.completeAccurate || 100;
			return ca < 90 ? '#e53e3e' : ca < 98 ? '#f6ad55' : '#38a169';
		})
		.style('display', (d) => {
			// Hide C/A for last processes (no outgoing normal connections)
			const isLastProcess = !connections.some((conn) => conn.sourceId === d.id && !conn.isRework);
			return isLastProcess ? 'none' : 'inline';
		})
		.text((d) => `%C/A: ${d.metrics.completeAccurate || 100}%`);

	// Add cycle time (normal path) metric
	metricGroups
		.append('text')
		.attr('x', blockWidth / 2)
		.attr('y', 38)
		.attr('text-anchor', 'middle')
		.attr('class', 'metric-total')
		.style('font-size', '12px')
		.style('font-weight', 'bold')
		.text((d) => {
			// Get process time from the process
			const processTime = d.metrics.processTime || 0;

			// Get wait time from any incoming connections (normal flow only)
			let incomingWaitTime = 0;
			if (normalConnections[d.id]) {
				// Sum up all wait times from normal incoming connections
				incomingWaitTime = normalConnections[d.id].reduce(
					(sum, conn) => sum + (conn.metrics?.waitTime || 0),
					0
				);
			}

			// Calculate total cycle time: process time + incoming wait time
			const totalCycleTime = processTime + incomingWaitTime;

			return `CT: ${formatDecimal(totalCycleTime)}`;
		});

	// Add rework cycle time (if process has rework or C/A < 100%)
	metricGroups
		.append('text')
		.attr('x', blockWidth / 2)
		.attr('y', 51)
		.attr('text-anchor', 'middle')
		.attr('class', 'metric-rework')
		.style('font-size', '11px')
		.style('font-weight', 'bold')
		.style('fill', '#e53e3e')
		.style('opacity', (d) => {
			// Check if this is the last process
			const isLastProcess = !connections.some((conn) => conn.sourceId === d.id && !conn.isRework);

			// If it's the last process, always hide rework metrics
			if (isLastProcess) return 0;

			// Otherwise, show based on whether there's rework
			const hasRework =
				d.metrics.reworkCycleTime > 0 ||
				(reworkConnections[d.id] && reworkConnections[d.id].length > 0) ||
				d.metrics.completeAccurate < 100;
			return hasRework ? 1 : 0;
		})
		.text((d) => {
			const reworkTime = d.metrics.reworkCycleTime || 0;
			return reworkTime > 0 ? `RT: +${formatDecimal(reworkTime)}` : '';
		});
}

export default {
	render: renderVSM
};
