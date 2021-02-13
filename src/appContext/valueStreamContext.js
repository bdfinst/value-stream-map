/* Useful resources on context
 * https://kentcdodds.com/blog/how-to-use-react-context-effectively
 * https://kentcdodds.com/blog/how-to-optimize-your-context-value
 * https://blog.logrocket.com/use-hooks-and-context-not-react-and-redux/#usecontext
 * https://kentcdodds.com/blog/application-state-management-with-react
 */

import React from 'react'
import ls from 'local-storage'

import { buildEdge, buildNode, edgeExists } from '../helpers'

const init = () => {
  const node1 = buildNode({ id: 1, x: 100, y: 150 })
  const node2 = buildNode({ id: 2, x: 350, y: 150 })

  const elements = [node1, node2, buildEdge(node1, node2)]
  return elements
}

const ValueStreamContext = React.createContext()

const vsInit = {
  maxNodeId: 2,
  elements: init(),
}

const valueStream = {
  maxNodeId: ls('maxNodeId') || vsInit.maxNodeId,
  elements: ls('elements') || vsInit.elements,
}

const updateLocalStorage = (state) => {
  ls('maxNodeId', state.maxNodeId)
  ls('elements', state.elements)
}

const resetVSM = () => {
  ls.clear()
  return vsInit
}

const addNode = (state, { x, y }) => {
  const nodeId = state.maxNodeId + 1

  const newState = {
    ...state,
    maxNodeId: nodeId,
    elements: [...state.elements, buildNode({ id: nodeId, x, y })],
  }
  updateLocalStorage(newState)
  return newState
}

const addEdge = (state, { source, target }) => {
  const newEdge = buildEdge(source, target)

  if (edgeExists(state.elements, newEdge)) {
    return state
  }

  const newState = {
    ...state,
    elements: [...state.elements, buildEdge(source, target)],
  }
  updateLocalStorage(newState)
  return newState
}

const updateNode = (state, { node, position, data }) => {
  const newState = {
    ...state,
    elements: state.elements.map((el) => {
      return el.id === node.id
        ? {
            ...el,
            data: data
              ? {
                  description: data.description
                    ? data.description
                    : el.data.description,
                  actors: data.actors ? data.actors : el.data.actors,
                  processTime: data.processTime
                    ? data.processTime
                    : el.data.processTime,
                  waitTime: data.waitTime ? data.waitTime : el.data.waitTime,
                  pctCompleteAccurate: data.pctCompleteAccurate
                    ? data.pctCompleteAccurate
                    : el.data.pctCompleteAccurate,
                }
              : el.data,
            position: {
              x: position ? position.x : el.position.x,
              y: position ? position.y : el.position.y,
            },
          }
        : el
    }),
  }
  updateLocalStorage(newState)
  return newState
}

const updateEdge = (state, { oldEdge, newTargetNode }) => {
  const newState = {
    ...state,
    elements: state.elements.map((edge) => {
      return edge.id === oldEdge.id
        ? { ...edge, target: newTargetNode.id }
        : edge
    }),
  }
  updateLocalStorage(newState)
  return newState
}

const deleteElements = (state, elementsToRemove) => {
  const idsToRemove = elementsToRemove.map((el) => el.id)

  const newState = {
    ...state,
    elements:
      state.elements.length > 1
        ? state.elements.filter((el) => !idsToRemove.includes(el.id))
        : state.elements,
  }

  updateLocalStorage(newState)
  return newState
}

const valueStreamReducer = (state, action) => {
  switch (action.type) {
    case 'INCREMENT': {
      return { ...valueStream, maxNodeId: state.maxNodeId + 1 }
    }
    case 'CREATE_NODE': {
      return addNode(state, action.data)
    }
    case 'CREATE_EDGE': {
      return addEdge(state, action.data)
    }
    case 'UPDATE_NODE': {
      return updateNode(state, action.data)
    }
    case 'UPDATE_EDGE': {
      return updateEdge(state, action.data)
    }
    case 'DELETE': {
      return deleteElements(state, action.data)
    }
    case 'RESET': {
      return resetVSM()
    }
    default: {
      throw new Error(`Unsupported action type: ${action.type}`)
    }
  }
}

const ValueStreamProvider = (props) => {
  const [state, dispatch] = React.useReducer(valueStreamReducer, valueStream)

  // const value = React.useMemo(() => [state, dispatch], [state])

  return <ValueStreamContext.Provider value={[state, dispatch]} {...props} />
}

const useValueStream = () => {
  const context = React.useContext(ValueStreamContext)
  if (!context) {
    throw new Error(`useValueStream must be used within a ValueStreamProvider`)
  }
  const [state, dispatch] = context

  const increment = () => dispatch({ type: 'INCREMENT' })

  const createNode = ({ x, y }) =>
    dispatch({ type: 'CREATE_NODE', data: { x, y } })

  const createEdge = ({ source, target }) =>
    dispatch({ type: 'CREATE_EDGE', data: { source, target } })

  const changeNodeValues = ({ node, position, data }) =>
    dispatch({ type: 'UPDATE_NODE', data: { node, position, data } })

  const changeEdge = ({ oldEdge, newTargetNode }) => {
    dispatch({ type: 'UPDATE_EDGE', data: { oldEdge, newTargetNode } })
  }

  const removeElements = (elements = []) => {
    dispatch({ type: 'DELETE', data: elements })
  }
  const reset = () => dispatch({ type: 'RESET' })

  return {
    state,
    increment,
    createNode,
    createEdge,
    changeNodeValues,
    changeEdge,
    removeElements,
    reset,
  }
}

export { ValueStreamProvider, useValueStream }
