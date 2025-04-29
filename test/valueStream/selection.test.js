import { describe, it, expect } from 'vitest';
import { getSelectionState, toggleSelection } from '../../src/lib/valueStream/selection.js';

describe('selection', () => {
  describe('toggleSelection', () => {
    it('selects an unselected item and deselects a selected item', () => {
      // Initial state with no selections
      const selectionState = getSelectionState();
      expect(selectionState.selectedIds).toEqual([]);
      
      // Select an item
      const updatedState = toggleSelection(selectionState, 'process1');
      expect(updatedState.selectedIds).toEqual(['process1']);
      
      // Deselect the same item
      const finalState = toggleSelection(updatedState, 'process1');
      expect(finalState.selectedIds).toEqual([]);
    });
  });
});