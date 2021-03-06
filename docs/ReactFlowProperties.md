# ReactFlow

- arrowHeadColor?: string;
- connectionLineComponent?: ConnectionLineComponent;
- connectionLineStyle?: CSSProperties;
- connectionLineType?: ConnectionLineType;
- connectionMode?: ConnectionMode;
- defaultPosition?: [number, number];
- defaultZoom?: number;
- deleteKeyCode?: KeyCode;
- edgeTypes?: EdgeTypesType;
- elements: Elements;
- elementsSelectable?: boolean;
- markerEndId?: string;
- maxZoom?: number;
- minZoom?: number;
- multiSelectionKeyCode?: KeyCode;
- nodeExtent?: NodeExtent;
- nodeTypes?: NodeTypesType;
- nodesConnectable?: boolean;
- nodesDraggable?: boolean;
- onConnect?: (connection: Edge | Connection) => void;
- onConnectEnd?: OnConnectEndFunc;
- onConnectStart?: OnConnectStartFunc;
- onConnectStop?: OnConnectStopFunc;
- onEdgeContextMenu?: (event: MouseEvent, nodes: Edge) => void;
- onEdgeUpdate?: OnEdgeUpdateFunc;
- onElementClick?: (event: MouseEvent, element: Node | Edge) => void;
- onElementsRemove?: (elements: Elements) => void;
- onLoad?: OnLoadFunc;
- onMove?: (flowTransform?: FlowTransform) => void;
- onMoveEnd?: (flowTransform?: FlowTransform) => void;
- onMoveStart?: (flowTransform?: FlowTransform) => void;
- onNodeContextMenu?: (event: MouseEvent, node: Node) => void;
- onNodeDrag?: (event: MouseEvent, node: Node) => void;
- onNodeDragStart?: (event: MouseEvent, node: Node) => void;
- onNodeDragStop?: (event: MouseEvent, node: Node) => void;
- onNodeMouseEnter?: (event: MouseEvent, node: Node) => void;
- onNodeMouseLeave?: (event: MouseEvent, node: Node) => void;
- onNodeMouseMove?: (event: MouseEvent, node: Node) => void;
- onPaneClick?: (event: MouseEvent) => void;
- onPaneContextMenu?: (event: MouseEvent) => void;
- onPaneScroll?: (event?: WheelEvent) => void;
- onSelectionChange?: (elements: Elements | null) => void;
- onSelectionContextMenu?: (event: MouseEvent, nodes: Node[]) => void;
- onSelectionDrag?: (event: MouseEvent, nodes: Node[]) => void;
- onSelectionDragStart?: (event: MouseEvent, nodes: Node[]) => void;
- onSelectionDragStop?: (event: MouseEvent, nodes: Node[]) => void;
- onlyRenderVisibleElements?: boolean;
- panOnScroll?: boolean;
- panOnScrollMode?: PanOnScrollMode;
- panOnScrollSpeed?: number;
- paneMoveable?: boolean;
- selectNodesOnDrag?: boolean;
- selectionKeyCode?: KeyCode;
- snapGrid?: [number, number];
- snapToGrid?: boolean;
- translateExtent?: TranslateExtent;
- zoomActivationKeyCode?: KeyCode;
- zoomOnDoubleClick?: boolean;
- zoomOnPinch?: boolean;
- zoomOnScroll?: boolean;
