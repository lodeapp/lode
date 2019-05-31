New:
    - Allow filtering by "selected" status. Useful for when you want a run a subset of files by their status, but want to keep them in view regardless of their subsequent outcomes
    - Lode will now remember the first time a test was seen and the last time it was run (in preparation for sorting)
    - Link to release notes from About window
Changed:
    - More minimalistic result pane tabs
    - Test information (previously "statistics") is no longer hidden while a test is in a transient status
    - If a file is excluded by filters they will now be collapsed in addition to being unselected
    - Improvements in content overflow sidebar, tests list and results pane
Fixed:
    - Issue with "Add another repository" button creating a new input that was not blank when trying to add multiple repositories at once
    - Prevent PHPUnit from returning empty traces
