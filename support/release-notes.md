New:
    - Progress indicator in application icon
    - More controls for running frameworks in bulk, including from repository or project context menus in the sidebar
Changed:
    - Better formatting of duration strings
    - Less dependency on Node APIs in the renderer process
    - Updated Primer CSS and Octicons to latest version
    - Pre-compile main process for faster loading times - #14
Fixed:
    - Opening files in external application alerting for an error that didn't occur
    - PHPUnit files getting stuck in "running" status if running a subset of tests in which one or more had been removed from the framework
