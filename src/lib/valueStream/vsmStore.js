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