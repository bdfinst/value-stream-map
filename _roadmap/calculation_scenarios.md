# Rework Scenarios Specification

This document outlines the behavior of rework calculations in the Value Stream Map using Gherkin syntax.

## Basic Terminology

- **Process**: A step in the value stream that takes time to complete
- **Wait Time**: Time between processes when work is waiting. A process's wait time is the wait time before a process.
  Process 1 will have no wait time.
- **C/A %**: Complete & Accurate percentage - the percent of work accepted by the next process
- **Rework**: Work that is rejected by the next process and must be done again
- **Explicit Rework**: Rework connections visually drawn on the map
- **Implicit Rework**: Rework assumed to exist when C/A < 100% but no explicit connection drawn

## Rules

- The first process will not have a wait time
- The last process will not have a C/A < 100

## No Rework Scenarios

### Scenario: Basic Value Stream with No Rework

```gherkin
Scenario: Basic value stream with no rework
  Given a value stream with 3 processes
    | Process | Process Time | C/A % |
    | Step 1  | 10           | 100   |
    | Step 2  | 20           | 100   |
    | Step 3  | 30           |       |
  And connections between processes
    | From   | To     | Wait Time |
    | Step 1 | Step 2 | 5         |
    | Step 2 | Step 3 | 10        |
  When the VSM metrics are calculated
  Then the cycle times should be
    | Process | Cycle Time |
    | Step 1  | 10         |
    | Step 2  | 25         |
    | Step 3  | 40         |
  And the lead time should be 75
  And the total rework time should be 0
  And the worst-case lead time should be 75
```

### Scenario: Value Stream with Different Wait Times

```gherkin
Scenario: Value stream with different wait times
  Given a value stream with 4 processes
    | Process | Process Time | C/A % |
    | Step A  | 2            | 100   |
    | Step B  | 3            | 100   |
    | Step C  | 4            | 100   |
    | Step D  | 3            |       |
  And connections between processes
    | From   | To     | Wait Time |
    | Step A | Step B | 1         |
    | Step B | Step C | 2         |
    | Step C | Step D | 1         |
  When the VSM metrics are calculated
  Then the cycle times should be
    | Process | Cycle Time |
    | Step A  | 2          |
    | Step B  | 4          |
    | Step C  | 6          |
    | Step D  | 4          |
  And the lead time should be 16
  And the total rework time should be 0
  And the worst-case lead time should be 16
```

## Implicit Rework Scenarios

### Scenario: Value Stream with Implicit Rework

```gherkin
Scenario: Value stream with implicit rework
  Given a value stream with 4 processes
    | Process | Process Time | C/A % |
    | Step 1  | 10           | 90    |
    | Step 2  | 20           | 80    |
    | Step 3  | 30           | 70    |
    | Step 4  | 5           |      |
  And connections between processes
    | From   | To     | Wait Time |
    | Step 1 | Step 2 | 5         |
    | Step 2 | Step 3 | 10        |
    | Step 3 | Step 4 | 5        |
  And no explicit rework connections
  When the VSM metrics are calculated
  Then the cycle times should be
    | Process | Cycle Time |
    | Step 1  | 10         |
    | Step 2  | 25         |
    | Step 3  | 40         |
    | Step 4  | 10         |
And the rework time should be
  And Process 1 should have rework time of 1 (calculated as 0.1 * (10))
  And Process 2 should have rework time of 5 (calculated as 0.2 * (5 + 20))
  And Process 3 should have rework time of 12 (calculated as 0.3 * (10 + 30))
  And the lead time should be 85
  And the total rework time should be 18
  And the worst-case lead time should be 103 (85 + 18)
```

## Explicit Rework Scenarios

### Scenario: Rework from Last Process to First

```gherkin
Scenario: Rework from last process to first process
  Given a value stream with 4 processes
    | Process | Process Time | C/A % |
    | Step 1  | 10           | 90    |
    | Step 2  | 20           | 80    |
    | Step 3  | 30           | 70    |
    | Step 4  | 10           |     |
  And connections between processes
    | From   | To     | Wait Time | Type    |
    | Step 1 | Step 2 | 5         | Normal  |
    | Step 2 | Step 3 | 10        | Normal  |
    | Step 3 | Step 4 | 10        | Normal  |
    | Step 3 | Step 1 | 15        | Rework  |
  When the VSM metrics are calculated
  Then the cycle times should be
    | Process | Cycle Time |
    | Step 1  | 10         |
    | Step 2  | 25         |
    | Step 3  | 40         |
    | Step 4  | 20         |
  And Process 1 should have rework time of 1 (calculated as 0.1 * (10))
  And Process 2 should have rework time of 5 (calculated as 0.2 * (5 + 20))
  And Process 3 should have rework time of 27 (calculated as 0.3 * (15 + 10 + 5 + 20 + 10 + 30))
  And the lead time should be 95
  And the total rework time should be 33
  And the worst-case lead time should be 128 (95 + 33)
```

## Tooltip Behavior

### Scenario: Tooltip displays correct rework path for middle process

```gherkin
Scenario: Tooltip displays correct rework path for middle process
  Given a value stream with 3 processes with C/A < 100%
  When I hover over a middle process
  Then the tooltip should show rework path as "Wait + Current"
  And the rework calculation should include the wait time, and current process time
```

## Data Entry Behavior

### Scenario: The process is the last process in the value stream

```gherkin
Scenario: The process is the last process
  Given a process does not connect to a next process
  Then the C/A field will not be editable
  And the C/A field will default to 100
  And the CA field wil not be displayed on the process
```
