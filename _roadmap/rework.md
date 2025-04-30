# Rework Scenarios Specification

This document outlines the behavior of rework calculations in the Value Stream Map using Gherkin syntax. These scenarios are based on the default values from the Software Development Value Stream.

## Basic Terminology

- **Process**: A step in the value stream that takes time to complete
- **Wait Time**: Time between processes when work is waiting. A process's wait time is the wait time before a process. Process 1 will have no wait time.
- **C/A %**: Complete & Accurate percentage - the percent of work accepted by the next process
- **Rework**: Work that is rejected by the next process and must be done again
- **Explicit Rework**: Rework connections visually drawn on the map
- **Implicit Rework**: Rework assumed to exist when C/A < 100% but no explicit connection drawn

## Rules

- The first process will not have a wait time
- The last process will not have a C/A < 100%

## No Rework Scenarios

### Scenario: Basic Value Stream with No Rework

```gherkin
Scenario: Basic value stream with no rework
  Given a value stream with processes
    | Process          | Process Time | C/A % |
    | Customer Request | 10           | 100   |
    | Analysis         | 30           | 100   |
    | Development      | 60           | 100   |
    | Testing          | 40           | 100   |
    | Deployment       | 20           |       |
  And connections between processes
    | From             | To          | Wait Time |
    | Customer Request | Analysis    | 5         |
    | Analysis         | Development | 15        |
    | Development      | Testing     | 20        |
    | Testing          | Deployment  | 10        |
  When the VSM metrics are calculated
  Then the cycle times should be
    | Process          | Cycle Time |
    | Customer Request | 10         |
    | Analysis         | 35         |
    | Development      | 75         |
    | Testing          | 60         |
    | Deployment       | 30         |
  And the lead time should be 210
  And the total rework time should be 0
  And the worst-case lead time should be 210
```

## Implicit Rework Scenarios

### Scenario: Value Stream with Implicit Rework

```gherkin
Scenario: Value stream with implicit rework
  Given a value stream with processes
    | Process          | Process Time | C/A % |
    | Customer Request | 10           | 100   |
    | Analysis         | 30           | 90    |
    | Development      | 60           | 85    |
    | Testing          | 40           | 95    |
    | Deployment       | 20           |       |
  And connections between processes
    | From             | To          | Wait Time |
    | Customer Request | Analysis    | 5         |
    | Analysis         | Development | 15        |
    | Development      | Testing     | 20        |
    | Testing          | Deployment  | 10        |
  And no explicit rework connections
  When the VSM metrics are calculated
  Then the cycle times should be
    | Process          | Cycle Time |
    | Customer Request | 10         |
    | Analysis         | 35         |
    | Development      | 75         |
    | Testing          | 60         |
    | Deployment       | 30         |
  And the rework time should be
    And Analysis should have rework time of 3.5 (calculated as 0.1 * (5 + 30))
    And Development should have rework time of 11.25 (calculated as 0.15 * (15 + 60))
    And Testing should have rework time of 3 (calculated as 0.05 * (20 + 40))
  And the lead time should be 210
  And the total rework time should be 17.75
  And the worst-case lead time should be 227.75
```

## Explicit Rework Scenarios

### Scenario: Rework from Testing back to Development

```gherkin
Scenario: Rework from Testing back to Development
  Given a value stream with processes
    | Process          | Process Time | C/A % |
    | Customer Request | 10           | 100   |
    | Analysis         | 30           | 90    |
    | Development      | 60           | 85    |
    | Testing          | 40           | 95    |
    | Deployment       | 20           |       |
  And connections between processes
    | From             | To          | Wait Time | Type    |
    | Customer Request | Analysis    | 5         | Normal  |
    | Analysis         | Development | 15        | Normal  |
    | Development      | Testing     | 20        | Normal  |
    | Testing          | Deployment  | 10        | Normal  |
    | Testing          | Development | 5         | Rework  |
  When the VSM metrics are calculated
  Then the cycle times should be
    | Process          | Cycle Time |
    | Customer Request | 10         |
    | Analysis         | 35         |
    | Development      | 75         |
    | Testing          | 60         |
    | Deployment       | 30         |
  And Analysis should have rework time of 3.5 (calculated as 0.1 * (5 + 30))
  And Development should have rework time of 11.25 (calculated as 0.15 * (15 + 60))
  And Testing should have rework time of 5.25 (calculated as 0.05 * (5 + 60 + 20 + 40)) - explicit rework path with rework connection wait time
  And the lead time should be 210
  And the total rework time should be approximately 20
  And the worst-case lead time should be approximately 230
```

## Tooltip Behavior

### Scenario: Tooltip displays correct rework path for middle process

```gherkin
Scenario: Tooltip displays correct rework path for middle process
  Given a value stream with processes with C/A < 100%
  When I hover over a middle process
  Then the tooltip should show rework path as "Wait time + Current process time"
  And the rework calculation should include incoming wait time and current process time
```

### Scenario: Tooltip displays correct rework path for explicit rework

```gherkin
Scenario: Tooltip displays correct rework path for explicit rework
  Given a value stream with an explicit rework connection
  When I hover over a process with explicit rework
  Then the tooltip should show rework path following the rework connection
  And the rework calculation should include rework wait time and all processes in the rework path
```

## Data Entry Behavior

### Scenario: The process is the last process in the value stream

```gherkin
Scenario: The process is the last process
  Given a process does not connect to a next process
  Then the C/A field will not be editable
  And the C/A field will default to 100
  And the C/A field will not be displayed on the process
```
