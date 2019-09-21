const crypto = require('crypto')
const _compact = require('lodash/compact')
const _find = require('lodash/find')
const _findIndex = require('lodash/findIndex')
const _get = require('lodash/get')
const _identity = require('lodash/identity')
const _isEmpty = require('lodash/isEmpty')
const _pickBy = require('lodash/pickBy')
const stripAnsi = require('strip-ansi')
const hasAnsi = require('has-ansi')
const bugsnag = require('@bugsnag/js')

class MockError extends Error {
    constructor (message, stack) {
        super(_get(stack.match(/(.+): (.+)/) || [], 2, '').trim())
        this.name = _get(stack.match(/(.+): (.+)/) || [], 1, '').trim()
        this.stack = stack
    }
}

class PreventPlugin {
    init (client) {
        client.config.beforeSend.push(function (report) {
            return new Promise(function (resolve, reject) {
                report.ignore()
                resolve()
            })
        })
    }
}

class Base64TestReporter {
    constructor (globalConfig, options) {
        this._globalConfig = globalConfig
        this._options = options
        this.feedbacks = []
        this.reports = []

        const bugsnagClient = bugsnag({
            apiKey: '.',
            autoNotify: false,
            autoCaptureSessions: false,
            logger: null,
            endpoints: {
                notify: 'file://null',
                sessions: 'file://null'
            }
        })
        bugsnagClient.use(new PreventPlugin())
        this.reporter = bugsnagClient
    }

    parseOriginalFeedback (feedback) {
        if (!feedback) {
            return ''
        }

        const prefix = '[1m[31m  [1m● '
        const hasPrefix = feedback.includes(prefix)

        // Map the feedback messages to their respective tests, preserving
        // the ANSI codes, which we'll later use to format our reports
        this.feedbacks = feedback
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

    async getFeedback (result) {
        if (result.status !== 'failed') {
            return null
        }

        try {
            return await new Promise((resolve, reject) => {
                let message = result.failureMessages[0]
                if (typeof message === 'object') {
                    // Also accept Error objects (stringified)
                    message = message.stack
                }
                const error = new MockError('', message)
                const feedback = this.transformFeedback(message, error)
                this.reporter.notify(error, {}, (err, report) => {
                    if (err) {
                        throw err
                    }
                    resolve({
                        content: _pickBy({
                            title: error.name,
                            [hasAnsi(feedback.message) ? 'ansi' : 'text']: feedback.message,
                            diff: feedback.diff,
                            trace: this.transformTrace(report)
                        }, _identity),
                        type: 'feedback'
                    })
                })
            })
        } catch (_) {
            // Fallback to Jest default's ANSI trace
            const feedback = _find(this.feedbacks, { test: result.fullName || result.title })
            return {
                content: feedback ? feedback.message : '',
                type: 'ansi'
            }
        }
    }

    hash (string) {
        return crypto.createHash('sha1').update(string).digest('hex')
    }

    async transform (result) {
        if (['skipped', 'pending'].includes(result.status)) {
            result.status = 'incomplete'
        }

        return {
            ancestors: result.ancestorTitles,
            id: this.hash(result.ancestorTitles.concat([result.title]).join('¦')),
            name: result.title,
            displayName: result.title,
            status: result.status,
            feedback: await this.getFeedback(result),
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

    transformTrace (report) {
        if (!report.stacktrace) {
            return null
        }

        return _compact(report.stacktrace.map(frame => {
            frame = _pickBy({
                file: _get(frame, 'file', null),
                line: _get(frame, 'lineNumber', null),
                code: _get(frame, 'code', null)
            }, property => property !== null)
            return _isEmpty(frame) ? null : frame
        }))
    }

    transformFeedback (feedback, error) {
        let diff = null
        let message = feedback
            .replace(error.name ? new RegExp(`^${error.name}\: `) : '', '') // Try to clean error name.
            .replace(/\n\s*at\s.+/gm, '') // Try to clean trace.

        if (message.search(/\n(Difference:\s*)?\x1b.*\-\sExpected\s*.+/) > -1) {
            diff = {
                '@': stripAnsi(message)
                    // Remove "Difference:" header, if present (Jest <= 23)
                    .replace(/(.+)(\nDifference:\s*)?(\-\sExpected\s*.+)/s, '$3')
                    // Add proper diff headers, including empty chunk headers for consistency.
                    .replace(/\-\sExpected/, '--- Expected')
                    .replace(/\+\sReceived\n/, '+++ Received\n@@ @@')
            }
            message = message.replace(/\n(Difference:\s*)?\x1b.*\-\sExpected\s*(.+)/s, '')
        }

        return {
            message,
            diff
        }
    }

    async failedSuiteTest (result) {
        return await this.transform({
            ancestorTitles: [result.testFilePath],
            failureMessages: [result.testExecError],
            title: 'Test suite failed to run',
            status: 'failed'
        })
    }

    group (suite, ungrouped) {
        const tests = []
        ungrouped.forEach(result => {
            let group = tests
            if (result.ancestors.length) {
                let prefix = suite
                result.ancestors.forEach(ancestor => {
                    const id = this.hash(`${prefix}¦${ancestor}`)
                    let index = _findIndex(group, { id })
                    prefix += `${ancestor}`
                    if (index === -1) {
                        const test = {
                            id,
                            name: ancestor,
                            displayName: ancestor,
                            console: [],
                            tests: []
                        }
                        group.push(test)
                        index = _findIndex(group, { id: test.id })
                    }
                    group = group[index].tests
                })
            }
            delete result.ancestors
            group.push(result)
        })
        return tests
    }

    async processTestResult (test, testResult, aggregatedResult) {
        // First, we parse Jest's formatted feedback, so it's available as a
        // fallback when we're trying to transform tests results.
        this.parseOriginalFeedback(testResult.failureMessage)

        // Second, we get the console logs that Jest has recorded, which are
        // not available after our asynchronous transformations finish.
        const logs = this.transformConsole(testResult.console)

        // Finally, we transform and group the actual test results and prepare
        // the response that will be given to the app.
        const tests = this.group(test.path, await Promise.all(testResult.testResults.map(async (result) => await this.transform(result))))

        // If test suite failed to run, add a test inside it for feedback
        if (!tests.length && testResult.failureMessage) {
            tests.push(await this.failedSuiteTest(testResult))
        }
        const results = {
            file: test.path,
            tests,
            console: logs
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

        return results
    }

    onTestResult (test, testResult, aggregatedResult) {
        this.reports.push(this.processTestResult(test, testResult, aggregatedResult).then(results => {
            const encoded = Buffer.from(JSON.stringify(results)).toString('base64')
            console.log(`(${encoded})`)
        }))
    }

    onRunStart (results) {
        console.log('\n<<<REPORT{')
    }

    onRunComplete (contexts, results) {
        return new Promise((resolve, reject) => {
            Promise.all(this.reports).then(() => {
                console.log('\n}REPORT>>>')
                resolve()
            })
        })
    }
}

module.exports = Base64TestReporter
