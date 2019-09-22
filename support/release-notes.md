Changed:
    - Errors from malformed Jest test suites are now treated as failures, with much improved feedback
    - Lode now enforces a content security policy
Fixed:
    - Stopping framework runs being unresponsive at times
    - Jest stack traces failing to properly parse filenames with spaces in them
    - Tests erroneously assuming "queued" status in some edge cases
    - Test parameters failing to show if suite was not expanded or selected before running
    - More resilient process output parsing, especially when dealing with stray output
