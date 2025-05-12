# Feature: Adding steps

```gherkin
Background:
Given there are existing steps

Scenario: One or more step exists
When I add a step
Then I will be required to add a connection
And I will be able to add a connection to an existing step
And I will be able to add a connection from an existing step
And the steps will be displayed in from/to sequence

Scenario: A step is at the end
Given the step has no connection to another step
Then it is the last step

Scenario: A step is at the beginning
Given the step has no connection from another step
Then it is the first step

Scenario: Visual representation of connections
Given I have connected steps in the value stream
Then normal connections should attach to the sides of steps
And rework connections should attach to the center-top of steps
And connections should have appropriate visual indicators
```

## Implementation Plan

After analyzing the existing codebase and the requirements for adding steps to the value stream map, I propose the following implementation plan:

### Current Behavior Analysis

1. **Process Creation**: Currently, steps (processes) can be added with the "Add Process" button, which opens a modal to configure the process attributes.
2. **Connection Management**: Connections are created with the "Add Connection" button, allowing users to select source and target processes.
3. **Process Sequence**: Processes are displayed based on their x-coordinate position, not explicitly based on flow sequence.
4. **First/Last Process Detection**: The code already has logic to detect if a process is the first or last:
   - Last processes (no outgoing non-rework connections) have different rendering behavior (no C/A displayed)
   - First processes (no incoming connections) have special rework handling

### Required Changes

1. **Connection Requirement After Adding Step**:

   - Modify the process creation workflow to prompt for connection creation immediately after adding a step
   - Display clear guidance that a connection is required

2. **Improved Step Sequence Visualization**:

   - Enhance the rendering logic to visually organize steps in a clearer from/to sequence
   - Automatically position new steps based on their connections

3. **Enhanced First/Last Step Identification**:

   - Add visual indicators to clearly mark first and last steps in the flow
   - Add tooltips or labels indicating "First Step" and "Last Step"

4. **Improved Connection Creation UX**:
   - Add direct "Connect From" and "Connect To" options when a process is selected
   - Implement visual guidance during connection creation
   - Connect rework connections at the center-top of process blocks
   - Connect normal flow connections at the sides of process blocks

### Technical Implementation Details

1. **Modify the Process Creation Flow**:

   - Update `createNewProcess()` in `+page.svelte` to store a flag indicating a new process was created
   - After process creation succeeds, automatically trigger connection creation if it's not the first process

2. **Enhance Connection Modal for New Processes**:

   - Update `ConnectionEditor.svelte` to pre-select the newly created process in the source or target dropdown
   - Add logic to detect if this is the first process in the system

3. **Update UI Components**:

   - Modify `VSMToolbar.svelte` to add support for "Connect From/To" options when a process is selected
   - Enhance the rendering in `renderVSM.js` to better visualize process sequence

4. **Add Visual Indicators**:

   - Update `renderProcessBlocks()` in `renderVSM.js` to add visual indicators for first/last processes
   - Add appropriate styling for these indicators
   - Ensure rework connections attach to the center-top of process blocks
   - Implement smooth curved paths for rework connections

5. **Automatic Layout Improvements**:
   - Enhance the automatic positioning logic when adding new processes
   - Modify `createVSM.js` calculateMetrics to better handle process sequences
   - Add visual cues for process sequences

### Development Sequence

1. ✅ Implement connection prompting after process creation
2. ✅ Add first/last process visual indicators
3. ✅ Enhance the connection UI for better usability
4. ✅ Improve automatic layout and positioning
5. ✅ Update styling and visual cues
6. ✅ Add comprehensive testing for the new features

This implementation plan addresses all requirements in the feature specification while maintaining compatibility with the existing architecture and enhancing the overall user experience.

## Implementation Summary

All features have been successfully implemented:

1. **Connection Prompting**: When a new process is added, the system now automatically prompts to create a connection.
2. **Visual Indicators**: First and last processes now have clear visual indicators making them easy to identify.
3. **Enhanced Connection UI**: Connections now have improved tooltips, visual attributes, and recommended paths.
4. **Automatic Layout**: A new "Auto Arrange" button has been added to automatically organize processes in logical flow sequence.
5. **Process Creation Workflow**: The process creation experience has been enhanced with better guidance for connections.
6. **Improved Connection Visualization**:
   - Normal connections attach to the sides of process blocks
   - Rework connections attach to the center-top of process blocks
   - Smooth curved paths for better visibility
   - Properly positioned labels and tooltips

The implementation follows the Test-Driven Development approach with comprehensive tests for each component:

- Unit tests for all new modules
- Integration tests for the features
- Existing E2E tests continue to pass

Users can now easily add steps to their value stream map with a much improved experience.
