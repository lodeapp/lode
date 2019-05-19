New:
    - Show "actual", "expected" and "expected (partial)" results from presence matching failures in PHPUnit, which improves feedback for Laravel-specific assertions like `assertSee` and `assertJson`
    - Copy to clipboard button for diff and trace panel contents
    - Toggle sort order on exception traces
Changed:
    - Exclude hidden part of a suite's path from keyword filtering
    - Clicking on repository name on sidebar will now collapse and expand it
    - Softeware update improvements
Fixed:
    - Repository scanning issue which could cause frameworks being wrongly identified when adding multiple repositories at once with auto-scanning turned on
