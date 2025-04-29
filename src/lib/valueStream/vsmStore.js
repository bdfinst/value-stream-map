import { writable } from 'svelte/store';
import createVSM from './createVSM.js';
import { getSelectionState } from './selection.js';

/**
 * Creates a VSM store with state management functions
 * @param {import('./createVSM').ValueStreamMap} initialVSM - Initial VSM data
 * @returns {Object} Store with VSM state and methods
 */
function initVSMStore(initialVSM) {
  // Create initial state with VSM and selection state
  const initialState = {
    vsm: initialVSM,
    selection: getSelectionState()
  };
  
  // Create writable store
  const { subscribe, set, update } = writable(initialState);
  
  return {
    subscribe,
    
    /**
     * Adds a process to the VSM
     * @param {import('./processBlock').ProcessBlock} process - Process to add
     */
    addProcess: (process) => {
      update(state => {
        // Use the VSM's addProcess function to maintain immutability
        const updatedVSM = createVSM.addProcess(state.vsm, process);
        
        return {
          ...state,
          vsm: updatedVSM
        };
      });
    },
    
    /**
     * Adds a connection to the VSM
     * @param {import('./connection').Connection} connection - Connection to add
     */
    addConnection: (connection) => {
      update(state => {
        // Use the VSM's addConnection function to maintain immutability
        const updatedVSM = createVSM.addConnection(state.vsm, connection);
        
        return {
          ...state,
          vsm: updatedVSM
        };
      });
    },
    
    /**
     * Updates a connection in the VSM
     * @param {string} connectionId - ID of connection to update
     * @param {Object} updates - Connection properties to update
     */
    updateConnection: (connectionId, updates) => {
      update(state => {
        // Find the connection to update
        const connectionIndex = state.vsm.connections.findIndex(c => c.id === connectionId);
        if (connectionIndex === -1) return state;
        
        // Get the current connection
        const connection = state.vsm.connections[connectionIndex];
        
        // Create updated connection (immutably)
        const updatedConnection = {
          ...connection,
          ...updates
        };
        
        // Create a new connections array with the updated connection
        const updatedConnections = [
          ...state.vsm.connections.slice(0, connectionIndex),
          updatedConnection,
          ...state.vsm.connections.slice(connectionIndex + 1)
        ];
        
        // Update the VSM with the new connections array
        const updatedVSM = createVSM.update(state.vsm, {
          connections: updatedConnections
        });
        
        return {
          ...state,
          vsm: updatedVSM
        };
      });
    },
    
    /**
     * Updates a process in the VSM
     * @param {string} processId - ID of process to update
     * @param {Object} updates - Process properties to update
     */
    updateProcess: (processId, updates) => {
      update(state => {
        // Find the process to update
        const processIndex = state.vsm.processes.findIndex(p => p.id === processId);
        if (processIndex === -1) return state;
        
        // Get the current process
        const process = state.vsm.processes[processIndex];
        
        // Create updated process (immutably)
        const updatedProcess = {
          ...process,
          ...updates
        };
        
        // Handle position updates properly
        if (updates.position) {
          updatedProcess.position = {
            ...updatedProcess.position,
            ...updates.position
          };
        }
        
        // Create a new processes array with the updated process
        const updatedProcesses = [
          ...state.vsm.processes.slice(0, processIndex),
          updatedProcess,
          ...state.vsm.processes.slice(processIndex + 1)
        ];
        
        // Update the VSM with the new processes array
        const updatedVSM = createVSM.update(state.vsm, {
          processes: updatedProcesses
        });
        
        return {
          ...state,
          vsm: updatedVSM
        };
      });
    },
    
    /**
     * Removes a process from the VSM
     * @param {string} processId - ID of process to remove
     */
    removeProcess: (processId) => {
      update(state => {
        // Filter out the process to remove
        const updatedProcesses = state.vsm.processes.filter(p => p.id !== processId);
        
        // Filter out connections involving the removed process
        const updatedConnections = state.vsm.connections.filter(
          c => c.sourceId !== processId && c.targetId !== processId
        );
        
        // Update the VSM
        const updatedVSM = createVSM.update(state.vsm, {
          processes: updatedProcesses,
          connections: updatedConnections
        });
        
        return {
          ...state,
          vsm: updatedVSM
        };
      });
    },
    
    /**
     * Removes a connection from the VSM
     * @param {string} connectionId - ID of connection to remove
     */
    removeConnection: (connectionId) => {
      update(state => {
        // Filter out the connection to remove
        const updatedConnections = state.vsm.connections.filter(c => c.id !== connectionId);
        
        // Update the VSM
        const updatedVSM = createVSM.update(state.vsm, {
          connections: updatedConnections
        });
        
        return {
          ...state,
          vsm: updatedVSM
        };
      });
    },
    
    /**
     * Toggles selection of an item
     * @param {string} id - ID of item to toggle selection
     */
    toggleSelection: (id) => {
      update(state => {
        const selectedIds = state.selection.selectedIds;
        const isSelected = selectedIds.includes(id);
        
        return {
          ...state,
          selection: {
            ...state.selection,
            selectedIds: isSelected
              ? selectedIds.filter(selectedId => selectedId !== id)
              : [...selectedIds, id]
          }
        };
      });
    },
    
    /**
     * Clears all selections
     */
    clearSelection: () => {
      update(state => ({
        ...state,
        selection: getSelectionState()
      }));
    },
    
    /**
     * Resets the store to a new VSM
     * @param {import('./createVSM').ValueStreamMap} vsm - New VSM to set
     */
    reset: (vsm) => {
      set({
        vsm,
        selection: getSelectionState()
      });
    }
  };
}

export { initVSMStore };