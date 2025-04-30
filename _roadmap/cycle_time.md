Feature: Rework to previous step with process and wait times

Background:
Given a value stream with the following steps:
| Step | PCA | Process Time | Wait Time |
| A | 0.95 | 2 | 1 |
| B | 0.85 | 3 | 2 |
| C | 0.90 | 4 | 2 |
| D | 0.80 | 3 | 1 |
And rework incurs an additional wait time of 1 hour before restarting the rejected step

Scenario: Work is rejected at Step D and returned to Step C
When a unit of work flows through steps A → B → C → D
And Step D rejects 20% of work
And rejected work is returned to Step C
Then the base lead time is: - Step A: 2 + 1 = 3 hours - Step B: 3 + 2 = 5 hours - Step C: 4 + 2 = 6 hours - Step D: 3 + 1 = 4 hours - Total = 18 hours

    And the rework lead time is:
      - Rework wait before Step C: 1 hour
      - Step C rework: 4 + 2 = 6 hours
      - Rework wait before Step D: 1 hour
      - Step D reattempt: 3 + 1 = 4 hours
      - Total = 1 + 6 + 1 + 4 = 12 hours

    And the new lead time for rejected work is 18 + 12 = 30 hours

    And the average lead time is:
      - (0.8 × 18) + (0.2 × 30) = 14.4 + 6.0 = 20.4 hours

Feature: Rework to earlier step with process and wait times

Background:
Given a value stream with the following steps:
| Step | PCA | Process Time | Wait Time |
| A | 0.95 | 2 | 1 |
| B | 0.85 | 3 | 2 |
| C | 0.90 | 4 | 2 |
| D | 0.80 | 3 | 1 |
And rework incurs an additional wait time of 1 hour before each reworked step

Scenario: Work is rejected at Step D and returned to Step B
When a unit of work flows through steps A → B → C → D
And Step D rejects 20% of work
And rejected work is returned to Step B
Then the base lead time is: - Step A: 2 + 1 = 3 hours - Step B: 3 + 2 = 5 hours - Step C: 4 + 2 = 6 hours - Step D: 3 + 1 = 4 hours - Total = 18 hours

    And the rework lead time is:
      - Rework wait before Step B: 1 hour
      - Step B rework: 3 + 2 = 5 hours
      - Rework wait before Step C: 1 hour
      - Step C reattempt: 4 + 2 = 6 hours
      - Rework wait before Step D: 1 hour
      - Step D reattempt: 3 + 1 = 4 hours
      - Total = 1 + 5 + 1 + 6 + 1 + 4 = 18 hours

    And the new lead time for rejected work is 18 + 18 = 36 hours

    And the average lead time is:
      - (0.8 × 18) + (0.2 × 36) = 14.4 + 7.2 = 21.6 hours

Feature: All steps complete without rework

Background:
Given a value stream with the following steps:
| Step | PCA | Process Time | Wait Time |
| A | 0.95 | 2 | 1 |
| B | 0.85 | 3 | 2 |
| C | 0.90 | 4 | 2 |
| D | 0.80 | 3 | 1 |

Scenario: Work flows through all steps without rejection
When a unit of work flows through steps A → B → C → D
And no step rejects the work
Then the total lead time is: - A: 2 + 1 = 3 - B: 3 + 2 = 5 - C: 4 + 2 = 6 - D: 3 + 1 = 4 - Total = 18 hours

    And rework time is 0 hours
