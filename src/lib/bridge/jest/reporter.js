const path = require('path')
const _find = require('lodash/find')
const _findIndex = require('lodash/findIndex')
const _trimStart = require('lodash/trimStart')
const stripAnsi = require('strip-ansi')
const Ansi  = require('ansi-to-html')

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

        // Map the feedback messages to their respective tests, preserving
        // the ANSI codes, which we'll later use to format our reports
        return feedback
            .split(prefix)
            .filter(message => {
                return message.replace(/\x1b/gi, '').length
            })
            .map(message => {
                let match = stripAnsi(message).match(/^.+\b/)[0]
                if (!match) {
                    return false
                }
                return {
                    feedback,
                    test: match.replace(/(\x1b|›\s)/gi, ''),
                    message: `${prefix}${message}`
                }
            })
            .filter(Boolean)
    }

    transform (result, feedbacks) {
        if (['skipped', 'pending'].includes(result.status)) {
            result.status = 'incomplete'
        }

        const feedback = _find(feedbacks, { test: result.fullName })

        return {
            ancestors: result.ancestorTitles,
            name: result.ancestorTitles.concat([result.title]).join('.'),
            displayName: result.title,
            status: result.status,
            feedback: feedback ? this.ansi.toHtml(feedback.message) : '',
            assertions: 0,
            console: []
        }
    }

    onTestResult (test, testResult, aggregatedResult) {
        const tests = []
        const feedbacks = this.parseFeedback(testResult.failureMessage)
        const ungrouped = testResult.testResults.map(result => this.transform(result, feedbacks))
        ungrouped.forEach(result => {
            if (result.ancestors.length) {
                let ancestor = ''
                while (result.ancestors.length) {
                    const title = result.ancestors.pop()
                    ancestor = _trimStart(`${ancestor}.${title}`, '.')
                    const group = _findIndex(tests, { name: ancestor })
                    if (group === -1) {
                        tests.push({
                            name: ancestor,
                            displayName: title,
                            status: result.status,
                            assertions: 0,
                            console: [],
                            tests: [result]
                        })
                        return true
                    }
                    if (typeof tests[group].tests === 'undefined') {
                        tests[group].tests = []
                    }
                    tests[group].tests.push(result)
                }
                return true
            }
            tests.push(result)
        })

        const results = {
            file: test.path,
            tests,
            ungrouped,
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
