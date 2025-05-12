# Value Stream Map Persistence

This document outlines the requirements and acceptance tests for persisting Value Stream Maps to the local file system.

## Overview

The Value Stream Map application should allow users to:

1. Save VSM data to a local file
2. Load existing VSM data from a local file
3. Automatically save changes to prevent data loss

## Implementation Approach

The implementation will use the browser's File System Access API where supported, with fallback to traditional file download/upload for older browsers.

## Acceptance Tests

### Feature: Save VSM to Local File System

```gherkin
Feature: Save VSM to Local File System
  As a value stream mapper
  I want to save my VSM to a local file
  So that I can preserve my work and share it with others

  Background:
    Given I have created a value stream map with processes and connections

  Scenario: Save VSM to a new file
    When I click the "Save" button
    Then a file save dialog should appear
    And I should be able to specify the filename and location
    And the file should be saved in JSON format
    And the file should contain all VSM data including:
      | processes with positions and metrics |
      | connections with metrics             |
      | VSM title and metadata               |
    And a success message should be displayed

  Scenario: Save VSM with a custom file name
    When I click the "Save As" button
    And I enter "my-value-stream" as the filename
    Then the file should be saved as "my-value-stream.vsm.json"

  Scenario: Overwrite existing VSM file
    Given I have previously saved the VSM to a file
    When I click the "Save" button
    Then the file should be updated with the current VSM state
    And no file dialog should appear
    And a success message should be displayed
```

### Feature: Load VSM from Local File System

```gherkin
Feature: Load VSM from Local File System
  As a value stream mapper
  I want to load a previously saved VSM
  So that I can continue my work or review a shared VSM

  Scenario: Load VSM from file
    Given I have a saved VSM file
    When I click the "Load" button
    And I select the VSM file from the file dialog
    Then the VSM should be loaded into the application
    And all processes should be displayed with correct positions and metrics
    And all connections should be displayed with correct paths and metrics
    And the VSM title should be updated to match the loaded file

  Scenario: Load VSM with unsaved changes
    Given I have unsaved changes in the current VSM
    When I click the "Load" button
    Then I should be prompted to save the current changes
    And I should be able to cancel the load operation

  Scenario: Handle invalid VSM file
    When I select a file that is not a valid VSM file
    Then an error message should be displayed
    And the current VSM should remain unchanged

  Scenario: Handle VSM file from newer version
    When I select a VSM file created with a newer version of the application
    Then a warning message should be displayed about potential compatibility issues
    And the application should attempt to load compatible data
```

### Feature: Auto-save VSM Changes

```gherkin
Feature: Auto-save VSM Changes
  As a value stream mapper
  I want changes to be automatically saved
  So that I don't lose work if the browser closes unexpectedly

  Background:
    Given I have loaded or created a VSM
    And I have previously saved the VSM to a file

  Scenario: Auto-save after process changes
    When I add a new process to the VSM
    Or I modify an existing process
    Or I delete a process
    Then the changes should be automatically saved to the previously used file
    And a subtle indication of the save status should be displayed

  Scenario: Auto-save after connection changes
    When I add a new connection
    Or I modify a connection's metrics
    Or I delete a connection
    Then the changes should be automatically saved to the previously used file
    And a subtle indication of the save status should be displayed

  Scenario: Detect auto-save failure
    Given there is a problem saving to the file
    When an auto-save is attempted
    Then an error notification should be displayed
    And the user should be prompted to save manually to a different location

  Scenario: Disable auto-save
    When I toggle the "Auto-save" setting to off
    Then changes should not be automatically saved
    And the save status should indicate that auto-save is disabled
```

### Feature: VSM File Management

```gherkin
Feature: VSM File Management
  As a value stream mapper
  I want to manage my saved VSM files
  So that I can organize my work effectively

  Scenario: Create new VSM with unsaved changes
    Given I have unsaved changes in the current VSM
    When I click the "New VSM" button
    Then I should be prompted to save the current changes
    And I should be able to cancel the new VSM operation

  Scenario: Recently used files
    When I open the application
    Then I should see a list of recently used VSM files
    And I should be able to quickly load a recently used file

  Scenario: Export VSM as image
    Given I have a VSM displayed
    When I click the "Export as PNG" button
    Then a PNG image of the entire VSM should be saved to the file system

  Scenario: Import from earlier versions
    Given I have a JSON file from an earlier version of the application
    When I load the file
    Then the application should upgrade the file format
    And display the VSM correctly
```

## Technical Requirements

1. The VSM data should be stored in a structured JSON format with a `.vsm.json` extension
2. File format should include version information for future compatibility
3. Auto-save should occur no more frequently than every 5 seconds to prevent performance issues
4. All file operations should be non-blocking and provide appropriate UI feedback
5. Fallback mechanisms should be provided for browsers that don't support the File System Access API
6. The application should maintain a list of recently used files (up to 10)
7. Users should always be notified of unsaved changes before closing the application

## MVP vs Future Enhancements

### MVP

- Basic save/load functionality
- Auto-save to previously saved file
- Unsaved changes warnings
- Recent files list

### Future Enhancements

- Cloud storage integration
- Collaboration features
- Version history
- Diff visualization between versions
- Automatic backup
