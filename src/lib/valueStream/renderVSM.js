import * as d3 from 'd3';

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
 * @param {Function} [params.options.onBlockClick] - Process block click handler
 * @returns {Object} - D3 selection of the rendered SVG
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
    onBlockClick = () => {}
  } = options;
  
  // Clear the container
  d3.select(container).selectAll('*').remove();
  
  // Create SVG container with zoom behavior
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
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
  
  // Render connections first (so they appear behind processes)
  renderConnections(connectionsGroup, vsm.connections, vsm.processes, { blockWidth, blockHeight });
  
  // Render process blocks
  renderProcessBlocks(processesGroup, vsm.processes, { 
    blockWidth, 
    blockHeight,
    onClick: onBlockClick
  });
  
  // Render metrics labels
  renderMetricsLabels(labelsGroup, vsm.processes, { blockWidth, blockHeight });
  
  return svg;
}

/**
 * Renders process blocks using D3
 * @param {Object} group - D3 selection for the group to render into
 * @param {Array<ProcessBlock>} processes - Process blocks to render
 * @param {Object} options - Rendering options
 */
function renderProcessBlocks(group, processes, options) {
  const { blockWidth, blockHeight, onClick } = options;
  
  // Create process block groups
  const processGroups = group.selectAll('.process')
    .data(processes, d => d.id)
    .enter()
    .append('g')
    .attr('class', 'process')
    .attr('transform', d => `translate(${d.position.x}, ${d.position.y})`)
    .style('cursor', 'pointer')
    .on('click', (event, d) => onClick(d));
  
  // Add process rectangles
  processGroups.append('rect')
    .attr('width', blockWidth)
    .attr('height', blockHeight)
    .attr('rx', 4)
    .attr('ry', 4)
    .attr('class', 'process-block')
    .style('fill', '#f0f0f0')
    .style('stroke', '#333')
    .style('stroke-width', 2);
  
  // Add process names
  processGroups.append('text')
    .attr('x', blockWidth / 2)
    .attr('y', blockHeight / 2)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('class', 'process-name')
    .style('font-weight', 'bold')
    .style('font-size', '14px')
    .text(d => d.name);
}

/**
 * Renders connections between processes
 * @param {Object} group - D3 selection for the group to render into
 * @param {Array<Connection>} connections - Connections to render
 * @param {Array<ProcessBlock>} processes - Process blocks for reference
 * @param {Object} options - Rendering options
 */
function renderConnections(group, connections, processes, options) {
  const { blockWidth, blockHeight } = options;
  
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
  group.selectAll('.connection')
    .data(connections, d => d.id)
    .enter()
    .append('g')
    .attr('class', 'connection')
    .each(function(d) {
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
      
      // Add batch size or flow info if available
      if (d.metrics && d.metrics.batchSize) {
        const midX = (sourceX + targetX) / 2;
        const midY = (sourceY + targetY) / 2;
        
        d3.select(this)
          .append('text')
          .attr('x', midX)
          .attr('y', midY - 10)
          .attr('text-anchor', 'middle')
          .attr('class', 'connection-metric')
          .style('font-size', '12px')
          .text(`Batch: ${d.metrics.batchSize}`);
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