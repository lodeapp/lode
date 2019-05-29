New:
  - Improved Jest feedback, with better separation between message and stack trace and rich traces instead of plain ANSI
  - Command-F will now focus on the framework's filtering input
  - Jump to documentation from application menu
Changed:
  - Exclude hidden part of a suite's path from keyword filtering, which should yield better results when copying and pasting paths from many different sources
  - Clicking on repository name on sidebar will now collapse and expand it
  - Better handling of collapsible panels with no content (no empty bodies, no copy button)
  - Software update improvements
Fixed:
  - Fix macOS malicious software alert in quarantined app, due to stricter control for notarized apps in 10.14.5
  - Code snippets failing to highlight first line
  - Don't try to calculate relative paths to files inside a stack trace frame if they're already relative
  - Odd filename truncation in relative paths in a collapsible panel's header
  - Missing icon in about window
