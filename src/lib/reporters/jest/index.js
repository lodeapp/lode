const crypto = require('crypto')
const _compact = require('lodash/compact')
const _find = require('lodash/find')
const _findIndex = require('lodash/findIndex')
const stripAnsi = require('strip-ansi')

class Base64TestReporter {
    constructor (globalConfig, options) {
        this._globalConfig = globalConfig
        this._options = options
    }

    parseFeedback (feedback) {
        if (!feedback) {
            return ''
        }

        const prefix = '[1m[31m  [1m● '
        const hasPrefix = feedback.includes(prefix)

        // Map the feedback messages to their respective tests, preserving
        // the ANSI codes, which we'll later use to format our reports
        return feedback
            .split(prefix)
            .filter(message => {
                return message.replace(/\x1b/g, '').length
            })
            .map(message => {
                const match = stripAnsi(message).match(/^.+\b/)[0].trim()
                if (!match) {
                    return false
                }
                return {
                    feedback,
                    hasPrefix,
                    test: match.replace(/(\x1b|›\s|●\s)/g, ''),
                    message: hasPrefix ? `${prefix}${message}` : message
                }
            })
            .filter(Boolean)
    }

    hash (string) {
        return crypto.createHash('sha1').update(string).digest('hex')
    }

    transform (result, feedbacks) {
        if (['skipped', 'pending'].includes(result.status)) {
            result.status = 'incomplete'
        }

        const feedback = _find(feedbacks, { test: result.fullName || result.title })

        return {
            ancestors: result.ancestorTitles,
            identifier: this.hash(result.ancestorTitles.concat([result.title]).join('¦')),
            name: result.title,
            displayName: result.title,
            status: result.status,
            feedback: {
                content: feedback ? feedback.message : '',
                type: 'ansi'
            },
            stats: {
                duration: result.duration
                // @TODO: Assertions don't seem to be properly counted. Let's hold this
                // off until we can make sure it represents the actual test.
                // assertions: 0,
            },
            // Console output is per-suite, not per-test. We only get the file
            // and line number from Jest, so it can't be otherwise for now.
            console: []
        }
    }

    transformConsole (output) {
        if (!output) {
            return []
        }

        return _compact(output.map(o => {
            try {
                return {
                    content: o.message,
                    line: o.origin.split(':')[1],
                    render: 'ansi',
                    type: o.type
                }
            } catch (error) {
                return null
            }
        }))
    }

    failedSuiteTest (result, feedbacks) {
        return this.transform({
            ancestorTitles: [result.testFilePath],
            title: 'Test suite failed to run',
            status: 'failed'
        }, feedbacks)
    }

    group (suite, ungrouped) {
        const tests = []
        ungrouped.forEach(result => {
            let group = tests
            if (result.ancestors.length) {
                let prefix = suite
                result.ancestors.forEach(ancestor => {
                    const identifier = this.hash(`${prefix}¦${ancestor}`)
                    let index = _findIndex(group, { identifier })
                    prefix += `${ancestor}`
                    if (index === -1) {
                        const test = {
                            identifier,
                            name: ancestor,
                            displayName: ancestor,
                            status: result.status,
                            console: [],
                            tests: []
                        }
                        group.push(test)
                        index = _findIndex(group, { identifier: test.identifier })
                    }
                    group = group[index].tests
                })
            }
            delete result.ancestors
            group.push(result)
        })
        return tests
    }

    onTestResult (test, testResult, aggregatedResult) {
        const feedbacks = this.parseFeedback(testResult.failureMessage)
        const tests = this.group(test.path, testResult.testResults.map(result => this.transform(result, feedbacks)))

        // If test suite failed to run, add a test inside it for feedback
        if (!tests.length && testResult.failureMessage) {
            tests.push(this.failedSuiteTest(testResult, feedbacks))
        }

        const results = {
            file: test.path,
            tests,
            console: this.transformConsole(testResult.console)
        }

        // Use the `useStderr` CLI option to determine whether we're in development
        // mode or not. Don't use the `verbose` flag, otherwise it mess up the console
        // buffering. And the `debug` flag doesn't get passed on to reporters.
        if (this._globalConfig.useStderr) {
            results['raw'] = {
                test,
                testResult,
                aggregatedResult
            }
        }

        const encoded = Buffer.from(JSON.stringify(results)).toString('base64')
        console.log(`(${encoded})`)
    }

    onRunStart (results) {
        console.log('\n<<<REPORT{')
    }

    onRunComplete (contexts, results) {
        console.log('\n}REPORT>>>')
    }
}

module.exports = Base64TestReporter
