const path = require('path')
const _find = require('lodash/find')
const _findIndex = require('lodash/findIndex')
const _trim = require('lodash/trim')
const stripAnsi = require('strip-ansi')
const Ansi = require('ansi-to-html')

class Base64TestReporter {
    constructor (globalConfig, options) {
        this._globalConfig = globalConfig
        this._options = options
        this.ansi = new Ansi({
            fg: '#ccc',
            bg: '#000',
            newline: true
        })
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
                const match = _trim(stripAnsi(message).match(/^.+\b/)[0])
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

    transform (result, feedbacks) {
        if (['skipped', 'pending'].includes(result.status)) {
            result.status = 'incomplete'
        }

        const feedback = _find(feedbacks, { test: result.fullName || result.title })

        return {
            ancestors: result.ancestorTitles,
            name: result.ancestorTitles.concat([result.title]).join('¦'),
            displayName: result.title,
            status: result.status,
            feedback: feedback ? this.ansi.toHtml(feedback.message) : '',
            assertions: 0,
            console: []
        }
    }

    failedSuiteTest (result, feedbacks) {
        return this.transform({
            ancestorTitles: [result.testFilePath],
            title: 'Test suite failed to run',
            status: 'failed'
        }, feedbacks)
    }

    group (ungrouped) {
        const tests = []
        ungrouped.forEach(result => {
            let group = tests
            if (result.ancestors.length) {
                let prefix = ''
                result.ancestors.forEach(ancestor => {
                    const name = `${prefix}${ancestor}`
                    let index = _findIndex(group, { name })
                    prefix += `${ancestor}¦`
                    if (index === -1) {
                        const test = {
                            name,
                            displayName: ancestor,
                            status: result.status,
                            assertions: 0,
                            console: [],
                            tests: []
                        }
                        group.push(test)
                        index = _findIndex(group, { name: test.name })
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
        const tests = this.group(testResult.testResults.map(result => this.transform(result, feedbacks)))

        // If test suite failed to run, add a test inside it for feedback
        if (!tests.length && testResult.failureMessage) {
            tests.push(this.failedSuiteTest(testResult, feedbacks))
        }

        const results = {
            file: test.path,
            tests,
            raw: {
                test,
                testResult,
                aggregatedResult
            }
        }

        const encoded = Buffer.from(JSON.stringify(results)).toString('base64')
        console.log(`(${encoded})`)
    }

    onRunStart (results) {
        console.log('\n{')
    }

    onRunComplete (contexts, results) {
        console.log('\n}')
    }
}

module.exports = Base64TestReporter
