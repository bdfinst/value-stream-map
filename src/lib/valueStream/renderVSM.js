import * as d3 from 'd3';
import { createProcessDragBehavior } from './draggable.js';
import { createConnectionDragBehavior } from './connectionDrag.js';

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
function renderVSM({
  container,
  vsm,
  options = {}
}) {
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
    onConnectionDrag = null,
    onZoomFit = null
  } = options;
  
  // Clear the container
  d3.select(container).selectAll('*').remove();
  
  // Get the actual dimensions of the container
  const containerRect = container.getBoundingClientRect();
  const containerWidth = containerRect.width || width;
  const containerHeight = containerRect.height || height;
  
  // Adjust viewBox to maintain aspect ratio based on container size
  const viewBoxWidth = Math.max(width, containerWidth);
  const viewBoxHeight = Math.max(height, containerHeight);
  
  // Create SVG container with zoom behavior and responsive sizing
  const svg = d3.select(container)
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', `0 0 ${viewBoxWidth} ${viewBoxHeight}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .attr('class', 'vsm-container');
  
  // Create a group for zoom/pan behavior
  const g = svg.append('g')
    .attr('class', 'vsm-content');
  
  // Add zoom behavior
  const zoom = d3.zoom()
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
    vsm.processes.forEach(process => {
      const x = process.position.x;
      const y = process.position.y;
      
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + blockWidth);
      maxY = Math.max(maxY, y + blockHeight + 45); // Include metrics box
    });
    
    // Add padding
    const padding = 50;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    
    // Calculate bounds
    const dx = maxX - minX;
    const dy = maxY - minY;
    const x = minX;
    const y = minY;
    
    // Calculate scale
    const scale = Math.min(
      0.9 * width / dx,
      0.9 * height / dy
    );
    
    // Calculate center position
    const translate = [
      width / 2 - scale * (x + dx / 2),
      height / 2 - scale * (y + dy / 2)
    ];
    
    // Apply zoom transform
    svg.transition()
      .duration(duration)
      .call(
        zoom.transform,
        d3.zoomIdentity
          .translate(translate[0], translate[1])
          .scale(scale)
      );
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
  
  // Render metrics labels
  renderMetricsLabels(labelsGroup, vsm.processes, { blockWidth, blockHeight });
  
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
  
  // Create process block groups
  const processGroups = group.selectAll('.process')
    .data(processes, d => d.id)
    .enter()
    .append('g')
    .attr('class', 'process')
    .attr('data-id', d => d.id) // Add data-id attribute for selection by ID
    .attr('transform', d => `translate(${d.position.x}, ${d.position.y})`)
    .style('cursor', 'grab');
  
  // Apply drag behavior if provided
  if (onDragEnd) {
    const allConnections = options.connections || [];
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
  
  // Add process rectangles
  processGroups.append('rect')
    .attr('width', blockWidth)
    .attr('height', blockHeight)
    .attr('rx', 4)
    .attr('ry', 4)
    .attr('class', 'process-block')
    .style('fill', '#f0f0f0')
    .style('stroke', '#333')
    .style('stroke-width', 2)
    .on('click', (event, d) => {
      // Toggle selection on block click
      onClick(d);
    });
  
  // Add process names with text wrapping
  processGroups.append('foreignObject')
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
    .text(d => d.name);
  
  // Add edit button with Font Awesome (positioned in top-right corner)
  const editGroup = processGroups.append('foreignObject')
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
  editGroup.append('xhtml:div')
    .attr('class', 'fa-container w-full h-full flex items-center justify-center')
    .html('<i class="fas fa-edit text-gray-600 hover:text-blue-500 text-lg"></i>');
}

/**
 * Renders connections between processes
 * @param {Object} group - D3 selection for the group to render into
 * @param {Array<Connection>} connections - Connections to render
 * @param {Array<ProcessBlock>} processes - Process blocks for reference
 * @param {Object} options - Rendering options
 * @param {number} options.blockWidth - Width of process blocks
 * @param {number} options.blockHeight - Height of process blocks
 * @param {Function} [options.onClick] - Connection click handler for selection
 * @param {Function} [options.onEditClick] - Connection edit handler
 * @param {Function} [options.onDragEnd] - Connection drag handler
 * @param {Array<ProcessBlock>} [options.processes] - Processes for reference
 */
function renderConnections(group, connections, processes, options) {
  const { blockWidth, blockHeight, onClick, onEditClick, onDragEnd, processes: allProcesses } = options;
  
  // Create a lookup map for processes by ID
  const processMap = processes.reduce((map, process) => {
    map[process.id] = process;
    return map;
  }, {});
  
  // Helper to calculate connection points
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
  
  // Generate line generator for connections
  const lineGenerator = d3.line()
    .curve(d3.curveBasis);
  
  // Create connection paths
  const connectionGroups = group.selectAll('.connection')
    .data(connections, d => d.id)
    .enter()
    .append('g')
    .attr('class', 'connection')
    .attr('data-id', d => d.id) // Add data-id for selection
    .style('cursor', onClick ? 'pointer' : 'default');
  
  if (onClick) {
    connectionGroups.on('click', (event, d) => onClick(d));
  }
  
  connectionGroups.each(function(d) {
    const points = getConnectionPoints(d);
    if (!points) return;
    
    const { sourceX, sourceY, targetX, targetY } = points;
    
    // Default control points if no custom path
    const pathPoints = d.path && d.path.length > 0 
      ? d.path
      : [
          [sourceX, sourceY],
          [sourceX + (targetX - sourceX) / 2, sourceY],
          [targetX - (targetX - sourceX) / 2, targetY],
          [targetX, targetY]
        ];
    
    // Render connection path
    d3.select(this)
      .append('path')
      .attr('d', lineGenerator(pathPoints))
      .attr('fill', 'none')
      .attr('stroke', '#555')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrow)');
      
    // Add draggable endpoint if drag handler is provided
    if (onDragEnd) {
      // Add a draggable endpoint at the target end of the path
      const endpointGroup = d3.select(this)
        .append('g')
        .attr('class', 'endpoint-group')
        // Don't set transform, so that the endpoint position is relative to connection group
      
      // Add the draggable endpoint circle
      endpointGroup.append('circle')
        .attr('class', 'endpoint')
        .attr('cx', targetX)
        .attr('cy', targetY)
        .attr('r', 6)
        .style('fill', '#4CAF50')
        .style('stroke', '#fff')
        .style('stroke-width', 2)
        .style('cursor', 'move');
      
      // Apply drag behavior
      endpointGroup.call(
        createConnectionDragBehavior(
          d3, 
          allProcesses, 
          blockWidth, 
          blockHeight, 
          onDragEnd
        )
      );
    }
    
    // Calculate the midpoint for adding controls/labels
    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;
    
    // Add edit button with Font Awesome
    if (onClick) {
      const editButton = d3.select(this)
        .append('foreignObject')
        .attr('class', 'connection-edit')
        .attr('x', midX - 14)
        .attr('y', midY - 4)
        .attr('width', 28)
        .attr('height', 28)
        .style('cursor', 'pointer')
        .on('click', (event, d) => {
          event.stopPropagation();
          
          // Use the dedicated edit handler if available
          if (onEditClick) {
            onEditClick(d);
          } else if (onClick) {
            // Fallback to onClick with 'edit' action if no dedicated handler
            onClick(d, 'edit');
          }
        });
      
      // Add Font Awesome edit icon using HTML
      editButton.append('xhtml:div')
        .attr('class', 'fa-container w-full h-full flex items-center justify-center')
        .html('<i class="fas fa-cog text-gray-600 hover:text-blue-500 text-lg bg-white rounded-full p-1"></i>');
    }
  });
  
  // Add arrow marker definition to SVG
  const defs = group.append('defs');
  
  defs.append('marker')
    .attr('id', 'arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 8)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#555');
}

/**
 * Renders metrics labels for processes
 * @param {Object} group - D3 selection for the group to render into
 * @param {Array<ProcessBlock>} processes - Process blocks
 * @param {Object} options - Rendering options
 */
function renderMetricsLabels(group, processes, options) {
  const { blockWidth, blockHeight } = options;
  
  // Create metric box groups under each process
  const metricGroups = group.selectAll('.metrics')
    .data(processes, d => d.id)
    .enter()
    .append('g')
    .attr('class', 'metrics')
    .attr('data-process-id', d => d.id) // Add reference to process ID
    .attr('transform', d => `translate(${d.position.x}, ${d.position.y + blockHeight + 5})`);
  
  // Add metric boxes
  metricGroups.append('rect')
    .attr('width', blockWidth)
    .attr('height', 40)
    .attr('rx', 2)
    .attr('ry', 2)
    .style('fill', '#f8f8f8')
    .style('stroke', '#ddd')
    .style('stroke-width', 1);
  
  // Add process time metric
  metricGroups.append('text')
    .attr('x', 5)
    .attr('y', 15)
    .attr('class', 'metric-label')
    .style('font-size', '10px')
    .text(d => `PT: ${d.metrics.processTime || 0}`);
  
  // Add wait time metric
  metricGroups.append('text')
    .attr('x', blockWidth - 5)
    .attr('y', 15)
    .attr('text-anchor', 'end')
    .attr('class', 'metric-label')
    .style('font-size', '10px')
    .text(d => `WT: ${d.metrics.waitTime || 0}`);
  
  // Add cycle time (total) metric
  metricGroups.append('text')
    .attr('x', blockWidth / 2)
    .attr('y', 30)
    .attr('text-anchor', 'middle')
    .attr('class', 'metric-total')
    .style('font-size', '12px')
    .style('font-weight', 'bold')
    .text(d => `CT: ${d.metrics.cycleTime || 0}`);
}

export default {
  render: renderVSM
};