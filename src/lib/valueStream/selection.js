/**
 * @typedef {Object} SelectionState
 * @property {Array<string>} selectedIds - IDs of selected elements
 */

/**
 * Creates an initial selection state with no selections
 * @returns {SelectionState} - Initial selection state
 */
function getSelectionState() {
  return {
    selectedIds: []
  };
}

/**
 * Toggles the selection state of an item
 * @param {SelectionState} state - Current selection state
 * @param {string} id - ID of the item to toggle
 * @returns {SelectionState} - Updated selection state
 */
function toggleSelection(state, id) {
  // Check if the item is already selected
  const isSelected = state.selectedIds.includes(id);
  
  // Create a new selection state with the item toggled
  return {
    ...state,
    selectedIds: isSelected
      ? state.selectedIds.filter(selectedId => selectedId !== id) // Remove if selected
      : [...state.selectedIds, id] // Add if not selected
  };
}

export { getSelectionState, toggleSelection };