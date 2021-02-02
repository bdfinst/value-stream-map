/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState } from 'react'
import ReactFlow, {
  Controls,
  MiniMap,
  ReactFlowProvider,
  addEdge,
  removeElements,
} from 'react-flow-renderer'

import { buildEdge, buildNode } from '../utils/utilities'
import { useValueStream } from '../reactContext'
import Sidebar from './Sidebar'
import StepNode from './StepNode'

const nodeTypes = {
  stepNode: StepNode,
}

let maxElementId = 0
const getElementId = () => `vsm_${maxElementId++}`

const VSMFlow = () => {
  const [reactFlowInstance, setReactFlowInstance] = useState(null)
  const { state, createEdge, createNode } = useValueStream()

  const [elements, setElements] = useState(state.elements)

  // useEffect(() => {
  //   dispatch({ type: 'SYNC', elements: elements })
  // }, [elements])

  const onConnect = (params) => {
    const found = elements.find((element) => {
      return (
        element.source === params.source && element.target === params.target
      )
    })
    if (!found) {
      setElements((els) => addEdge(params, els))
    }
  }

  const onElementsRemove = (elementsToRemove) =>
    setElements((els) => removeElements(elementsToRemove, els))

  const onLoad = (_reactFlowInstance) =>
    setReactFlowInstance(_reactFlowInstance)

  const onDragOver = (event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  const autoConnect = (newNode) => {
    const nodes = elements.filter(
      (el) => el.hasOwnProperty('type') && el.type === 'stepNode',
    )
    const source = nodes[nodes.length - 1].id

    createEdge(buildEdge(getElementId(), source, newNode.id))
    console.log(state)
    setElements((element) =>
      element.concat(buildEdge(getElementId(), source, newNode.id)),
    )
  }

  const onDrop = (event) => {
    event.preventDefault()

    const position = reactFlowInstance.project({
      x: event.clientX,
      y: event.clientY - 40,
    })

    const id = getElementId()

    const newNode = buildNode(id, position)
    createNode(newNode)

    setElements((element) => element.concat(newNode))
    autoConnect(newNode)
  }

  return (
    <div className="vsmflow">
      <ReactFlowProvider>
        <div className="reactflow-wrapper">
          <ReactFlow
            elements={elements}
            onConnect={onConnect}
            onElementsRemove={onElementsRemove}
            onLoad={onLoad}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
          >
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                switch (node.type) {
                  case 'input':
                    return 'red'
                  case 'default':
                    return '#00ff00'
                  case 'output':
                    return 'rgb(0,0,255)'
                  default:
                    return '#eee'
                }
              }}
            />
          </ReactFlow>
        </div>
        <Sidebar />
      </ReactFlowProvider>
    </div>
  )
}

export default VSMFlow
