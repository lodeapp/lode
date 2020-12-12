New:
    - "Filter and run" action from suite context menu
    - One-click content copy from snippets in test results and alerts
Changed:
    - Updated to Electron 11
    - Enforce context isolation in renderer process for added security
    - Improved memory footprint in renderer process
    - Interface and icons refinements, from updated Primer versions
    - Various stability improvements
    - Removed dynamic sorting
Fixed:
    - Console file paths in Jest 25+
    - Updater failures could cause the app to freeze
    - Jitter when switching frameworks on a sidebar with overflowing content
An extensive refactor of Lode's codebase to ensure it adheres to Electron's latest security best-practices (#45). It also updates dependencies to much newer versions (including underlying Node and Chrome versions) for a faster and more stable foundation, which will soon allow for additional improvements and Apple Silicon builds, too.
