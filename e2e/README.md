# End-to-End Tests for Value Stream Map

This directory contains end-to-end tests for the Value Stream Map application using Playwright.

## Current Test Suite

The current test suite focuses on basic functionality of the application:

### Working Tests

1. **Basic Rendering**: Verifies that the initial VSM loads with sample data
2. **Process Creation**: Tests adding a new process block
3. **Connection Creation**: Tests creating connections between processes

### Tests In Progress

These tests have been implemented but currently skipped due to issues with element selection and visibility:

4. **Process Deletion**: Tests selecting and deleting a process
5. **Process Editing**: Tests editing an existing process
6. **Metrics Legend**: Tests toggling the metrics legend modal
7. **Metrics Updates**: Tests updating metrics when process values change
8. **Zoom Controls**: Tests zoom in, out, and fit-to-screen functionality
9. **Form Validation**: Tests validation in the process editor modal

## Running Tests

```bash
# Run all tests
npx playwright test e2e

# Run a specific test file
npx playwright test e2e/vsm-interactions.test.js

# Run tests with UI
npx playwright test e2e/vsm-interactions.test.js --headed

# Run a specific test by line number
npx playwright test "e2e/vsm-interactions.test.js:16"
```

## Known Issues

1. **Process Selection**: Clicking on a process doesn't consistently select it, which affects tests that require selection
2. **Remove Button Visibility**: The "Remove Selected" button doesn't appear after selecting a process
3. **Edit Icon Access**: The edit icon (cog/gear) in process blocks can be difficult to target with selectors
4. **Modal Dialog Testing**: Testing modals can be challenging due to multiple elements with similar roles

## Future Improvements

1. Add data-testid attributes to key elements to make selections more reliable
2. Implement more direct ways to test SVG elements and D3 visualizations
3. Create helper functions for common test operations (process selection, editing, etc.)
4. Add more thorough tests for edge cases and error handling
