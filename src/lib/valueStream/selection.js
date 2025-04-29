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
 * Toggles the selection state of an item, ensuring only one item is selected at a time
 * @param {SelectionState} state - Current selection state
 * @param {string} id - ID of the item to toggle
 * @returns {SelectionState} - Updated selection state
 */
function toggleSelection(state, id) {
  // Check if the item is already selected
  const isSelected = state.selectedIds.includes(id);
  
  // Create a new selection state with the item toggled
  if (isSelected) {
    // If already selected, deselect it
    return {
      ...state,
      selectedIds: []
    };
  } else {
    // If not selected, select only this item (deselect others)
    return {
      ...state,
      selectedIds: [id]
    };
  }
}

/**
 * Sets the selection state to a specific item
 * @param {SelectionState} state - Current selection state
 * @param {string} id - ID of the item to select
 * @returns {SelectionState} - Updated selection state
 */
function selectItem(state, id) {
  return {
    ...state,
    selectedIds: [id]
  };
}

export { getSelectionState, toggleSelection, selectItem };