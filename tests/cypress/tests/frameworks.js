import _ from 'lodash'
const { ipcRenderer } = window.electron

describe('Framework management', () => {
    beforeEach(function () {
        this.suites = {}
        this.tests = {}
        this.ledger = {}
        this.statusMap = {}
        this.frameworks = []

        this.addFramework = (framework, suites, tests) => {
            this.suites[framework.id] = suites
            if (tests) {
                this.tests[framework.id] = tests
            }
            this.ledger[framework.id] = {
                ...this.ledgerStub,
                idle: suites.length
            }
            this.statusMap[framework.id] = suites.reduce((obj, item) => ({
                ...obj,
                [item.file]: 'idle'
            }), {})

            this.frameworks.push(framework)
        }

        this.defaultResolver = (method, ...args) => {
            switch (method) {
                case 'repository-frameworks':
                    return this.frameworks
                case 'repository-exists':
                    return true
                case 'framework-get':
                    return Promise.resolve(_.find(this.frameworks, { id: args[0] }))

                case 'framework-get-ledger':
                    return {
                        ledger: this.ledger[args[0]],
                        status: this.statusMap[args[0]]
                    }
            }
            return Promise.resolve()
        }

        cy
            .fixture('framework/ledger.json').then(ledger => {
                this.ledgerStub = ledger
            })
            .fixture('framework/repositories.json').then(repositories => {
                // Use only one repository, for simplicity.
                this.repositories = repositories.slice(0, 1)
            })
            .fixture('framework/jest/26/options.json').then(framework => {
                cy.fixture('framework/jest/26/suites.json').then(suites => {
                    this.addFramework(framework, suites)
                })
            })
            .fixture('framework/phpunit/8.0/options.json').then(framework => {
                cy.fixture('framework/phpunit/8.0/suites.json').then(suites => {
                    cy.fixture('framework/phpunit/8.0/tests.json').then(tests => {
                        this.addFramework(framework, suites, tests)
                    })
                })
            })
            .fixture('framework/types.json').then(frameworkTypes => {
                this.frameworkTypes = frameworkTypes
            })
    })

    it('manages existing frameworks', function () {
        cy
            .startWithProject()
            .nextTick(() => {
                cy.stub(ipcRenderer, 'invoke', this.defaultResolver)
            })
            .ipcEvent('42:repositories', this.repositories)
            .nextTick()
            .assertInvokedOnce('repository-frameworks', 'repository-1')
            .ipcResetMockHistory()
            .ipcEvent('framework-active', 'jest-1', this.repositories[0])
            .nextTick()
            .ipcEmission(0).assertArgs('project-active-framework', 'jest-1')
            .ipcEmission(1).assertArgs('framework-suites', 'jest-1')
            .ipcInvocation(0).assertArgs('repository-exists', 'repository-1')
            .ipcInvocation(1).assertArgs('framework-get', 'jest-1')
            .ipcInvocation(2).assertArgs('framework-get-ledger', 'jest-1')
            .ipcResetMockHistory()
            .ipcEvent('jest-1:refreshed', this.suites['jest-1'], this.suites['jest-1'].length)
            .get('.sidebar section.scrollable .sidebar-item--framework:first')
            .should('contain.text', 'Jest')
            .should('have.class', 'status--idle')
            .should('have.class', 'is-active')
            .get('.sidebar section.scrollable .sidebar-item--framework:last')
            .should('have.class', 'status--idle')
            .should('not.have.class', 'is-active')
            .should('contain.text', 'PHPUnit')
            .get('.split')
            .should('not.have.class', 'empty')
            .get('#results .results')
            .should('have.class', 'blankslate')
            .should('contain.text', 'No test selected')
            .get('#list .framework')
            .should('have.class', 'status--idle')
            .find('.heading .name')
            .should('contain.text', 'Jest')
            .get('.framework .actions button')
            .should('have.length', 4)
            .get('.framework .actions button:eq(0)')
            .should('have.class', 'more-actions')
            .get('.framework .actions button:eq(2)')
            .should('have.class', 'btn-primary')
            .should('contain.text', 'Run')
            .get('.framework .actions button:eq(3)')
            .should('not.have.class', 'btn-primary')
            .should('contain.text', 'Stop')
            .should('be.disabled')
            .get('.filters .progress-breakdown .Label')
            .should('have.length', 1)
            .get('.filters .progress-breakdown .Label--idle')
            .assertNormalizedText('15 idle')
            .get('.search')
            .should('exist')
            .get('.sort')
            .should('contain.text', '15 items sorted by Name')
            .get('.framework > .children > .nugget').as('nuggets')
            .should('have.length', 15)
            .get('@nuggets').filter('.is-collapsed.has-children')
            .should('have.length', 15)
            .get('@nuggets').eq(0).find('.filename > .dir')
            .assertNormalizedText('__tests__/')
            .get('@nuggets').eq(0).find('.filename > .name')
            .assertNormalizedText('BadlyNested.spec.js')
            // Switch framework
            .get('.sidebar section.scrollable .sidebar-item--framework:last')
            .click()
            .ipcEmission(0).assertArgs('project-active-framework', 'phpunit-1')
            .ipcEmission(1).assertArgs('framework-suites', 'phpunit-1')
            .ipcInvocation(0).assertArgs('repository-exists', 'repository-1')
            .ipcInvocation(1).assertArgs('framework-get', 'phpunit-1')
            .ipcInvocation(2).assertArgs('framework-get-ledger', 'phpunit-1')
            .ipcResetMockHistory()
            .ipcEvent('phpunit-1:refreshed', this.suites['phpunit-1'], this.suites['phpunit-1'].length)
            .get('#list .framework')
            .should('have.class', 'status--idle')
            .find('.heading .name')
            .should('contain.text', 'PHPUnit')
            .get('.framework .actions button')
            .should('have.length', 4)
            .get('.framework .actions button:eq(0)')
            .should('have.class', 'more-actions')
            .get('.framework .actions button:eq(2)')
            .should('have.class', 'btn-primary')
            .should('contain.text', 'Run')
            .get('.framework .actions button:eq(3)')
            .should('not.have.class', 'btn-primary')
            .should('contain.text', 'Stop')
            .should('be.disabled')
            .get('.filters .progress-breakdown .Label')
            .should('have.length', 1)
            .get('.filters .progress-breakdown .Label--idle')
            .assertNormalizedText('14 idle')
            .get('.search')
            .should('exist')
            .get('.sort')
            .should('contain.text', '14 items sorted by Running order')
            .get('@nuggets')
            .should('have.length', 14)
            .get('@nuggets').filter('.is-collapsed')
            .should('have.length', 14)
            .get('@nuggets').filter('.has-children')
            .should('have.length', 13)
            .get('@nuggets').not('.has-children').find('.filename > .name')
            .assertNormalizedText('EmptyTest.php')
            .get('@nuggets').eq(0).find(' .filename > .dir')
            .assertNormalizedText('tests/Unit/')
            .get('@nuggets').eq(0).find(' .filename > .name')
            .assertNormalizedText('ConsoleTest.php')
            .click()
            .assertEmittedOnce(
                'framework-toggle-child',
                'phpunit-1',
                ['/lodeapp/lode/hobnobs/tests/Unit/ConsoleTest.php'],
                true
            )
            .ipcResetMockHistory()
            .ipcEvent(
                '/lodeapp/lode/hobnobs/tests/Unit/ConsoleTest.php:framework-tests',
                this.tests['phpunit-1']['/lodeapp/lode/hobnobs/tests/Unit/ConsoleTest.php']
            )
            .get('@nuggets').eq(1).find('.filename > .name')
            .assertNormalizedText('DataProviderTest.php')
            .click()
            .assertEmittedOnce(
                'framework-toggle-child',
                'phpunit-1',
                ['/lodeapp/lode/hobnobs/tests/Unit/DataProviderTest.php'],
                true
            )
            .ipcResetMockHistory()
            .ipcEvent(
                '/lodeapp/lode/hobnobs/tests/Unit/DataProviderTest.php:framework-tests',
                this.tests['phpunit-1']['/lodeapp/lode/hobnobs/tests/Unit/DataProviderTest.php']
            )
            .get('@nuggets').eq(0)
            .should('have.class', 'is-expanded')
            .find('.nugget-items > .nugget')
            .should('have.length', 8)
            .should('have.class', 'test')
            .should('have.class', 'status--idle')
            .should('have.class', 'is-collapsed')
            .get('@nuggets').eq(0).find('.nugget-items > .nugget:first')
            .find('.test-name')
            .assertNormalizedText('Console log null')
            .get('@nuggets').eq(1)
            .should('have.class', 'is-expanded')
            .find('.nugget-items > .nugget')
            .should('have.length', 9)
            .should('have.class', 'test')
            .should('have.class', 'status--idle')
            .should('have.class', 'is-collapsed')
            .get('@nuggets').eq(1).find('.nugget-items > .nugget:first')
            .find('.test-name')
            .assertNormalizedText('Data provider success with data set # 0')
            .get('@nuggets').eq(1).find('> .header').as('header')
            .click()
            .assertEmittedOnce(
                'framework-toggle-child',
                'phpunit-1',
                ['/lodeapp/lode/hobnobs/tests/Unit/DataProviderTest.php'],
                false
            )
            .ipcResetMockHistory()
            .get('@header').parent()
            .should('have.class', 'is-collapsed')
            .get('@nuggets').filter('.is-expanded')
            .should('have.length', 1)
    })

    it('can filter suites', function () {
        cy
            .startWithProject()
            .nextTick(() => {
                // Modify the Jest framework's statuses
                this.ledger['jest-1'] = _.mapValues(this.ledger['jest-1'], (value, key) => {
                    switch (key) {
                        case 'idle':
                            return 0
                        case 'passed':
                            return this.suites['jest-1'].length
                        default:
                            return value
                    }
                })
                this.statusMap['jest-1'] = _.mapValues(this.statusMap['jest-1'], () => 'passed')

                // Stub invocations for this test
                cy.stub(ipcRenderer, 'invoke', this.defaultResolver)
            })
            .ipcEvent('42:repositories', this.repositories)
            .ipcEvent('framework-active', 'jest-1', this.repositories[0])
            .nextTick()
            .ipcEvent('jest-1:refreshed', this.suites['jest-1'], this.suites['jest-1'].length)
            .nextTick()
            .ipcResetMockHistory()
            .get('.cutoff')
            .should('not.exist')
            .get('.actions .btn-primary').as('run')
            .assertNormalizedText('Run')
            .get('.framework')
            .should('not.have.class', 'selective')
            .get('.framework > .children > .nugget').as('nuggets')
            .should('have.length', 15)
            .should('have.class', 'status--passed')
            .get('.filters .progress-breakdown > .Label')
            .should('have.length', 1)
            .should('have.class', 'Label--passed')
            .should('not.have.class', 'is-active')
            .click()
            .should('have.class', 'is-active')
            .assertEmittedOnce('framework-filter', 'jest-1', 'status', ['passed'])
            .ipcResetMockHistory()
            .get('@run')
            .assertNormalizedText('Run matches 15')
            .get('@nuggets').eq(0).find(' > .header input')
            .should('not.be.visible')
            .get('@nuggets').eq(0).find(' > .header button')
            .click()
            .get('@nuggets').eq(0).find(' > .header input')
            .should('be.visible')
            .get('@nuggets').eq(0).find(' > .header button')
            .should('not.be.visible')
            .get('.framework')
            .should('have.class', 'selective')
            .get('@nuggets').eq(1).find(' > .header button')
            .click()
            .ipcEmission(0).assertArgs(
                'framework-select',
                'jest-1',
                ['/lodeapp/lode/hobnobs/__tests__/BadlyNested.spec.js'],
                true
            )
            .ipcEmission(1).assertArgs(
                'framework-select',
                'jest-1',
                ['/lodeapp/lode/hobnobs/__tests__/Console.spec.js'],
                true
            )
            .ipcResetMockHistory()
            .ipcEvent('jest-1:selective', 2)
            .get('.filters .progress-breakdown > .Label')
            .should('have.length', 2)
            .get('.filters .progress-breakdown > .Label:first')
            .should('have.class', 'Label--selected')
            .should('not.have.class', 'is-active')
            .click()
            .assertEmittedOnce(
                'framework-filter',
                'jest-1',
                'status',
                ['passed', 'selected']
            )
            .ipcResetMockHistory()
            // Return only a subset of suites: the selected ones
            .ipcEvent('jest-1:refreshed', this.suites['jest-1'].slice(0, 2), 2)
            .get('@nuggets')
            .should('have.length', 2)
            .should('have.class', 'status--passed')
            .get('@nuggets').find('input')
            .should('be.checked')
            .get('.filters .progress-breakdown > .Label--passed')
            .click()
            .should('not.have.class', 'is-active')
            .get('@nuggets')
            .should('have.length', 2)
            .get('@nuggets').eq(1).find('> .header button')
            .click()
            .get('@nuggets')
            .should('have.length', 1)
            .ipcEmission(1).assertArgs(
                'framework-select',
                'jest-1',
                ['/lodeapp/lode/hobnobs/__tests__/Console.spec.js'],
                false
            )
            .ipcResetMockHistory()
            .get('@nuggets').eq(0).find(' > .header button')
            .click()
            .get('.filters .progress-breakdown > .Label--selected')
            .click()
            .ipcEmission(1).assertArgs(
                'framework-filter',
                'jest-1',
                'status',
                []
            )
            .ipcResetMockHistory()
            .ipcEvent('jest-1:selective', 0)
            .ipcEvent(
                'jest-1:refreshed',
                // Clone the suites object, because it'll be spliced during
                // assertions and we want to reference the original afterwards.
                _.clone(this.suites['jest-1']),
                this.suites['jest-1'].length
            )
            .get('.framework')
            .should('not.have.class', 'selective')
            .get('@nuggets')
            .should('have.length', 15)
            .should('have.class', 'status--passed')
            .get('.filters .progress-breakdown > .Label')
            .should('have.length', 1)
            .should('have.class', 'Label--passed')
            .should('not.have.class', 'is-active')
            .ipcEvent(() => {
                // Simulate a suite failing. It should remain in the list,
                // as we're not filtering for status.
                const ledger = _.clone(this.ledger['jest-1'])
                const statusMap = _.clone(this.statusMap['jest-1'])
                ledger.passed -= 1
                ledger.failed += 1
                statusMap['/lodeapp/lode/hobnobs/__tests__/Console.spec.js'] = 'failed'

                return ['jest-1:ledger', ledger, statusMap]
            })
            .get('@nuggets')
            .should('have.length', 15)
            .get('@nuggets').filter('.status--passed')
            .should('have.length', 14)
            .get('@nuggets').filter('.status--failed')
            .should('have.length', 1)
            .get('@nuggets').filter('.status--failed').find('.filename > .name')
            .assertNormalizedText('Console.spec.js')
            .ipcEvent(() => {
                // Defer computation of ledger and status map, as we're
                // overriding the Cypress test suite's default.
                return ['jest-1:ledger', this.ledger['jest-1'], this.statusMap['jest-1']]
            })
            .get('.filters .progress-breakdown > .Label--passed')
            .click()
            .ipcResetMockHistory()
            .ipcEvent(() => {
                // Simulate a suite failing again. This time it should be
                // removed from view, as we're filtering by a different status.
                const ledger = _.clone(this.ledger['jest-1'])
                const statusMap = _.clone(this.statusMap['jest-1'])
                ledger.passed -= 1
                ledger.failed += 1
                statusMap['/lodeapp/lode/hobnobs/__tests__/Console.spec.js'] = 'failed'

                return ['jest-1:ledger', ledger, statusMap]
            })
            .get('@nuggets')
            .should('have.length', 14)
            .should('have.class', 'status--passed')
            .get('.filters .progress-breakdown > .Label--failed')
            .should('not.have.class', 'is-active')
            .assertNormalizedText('1 failed')
            .get('@run')
            .assertNormalizedText('Run matches 14')
            .get('.cutoff')
            .should('exist')
            .assertNormalizedText('1 hidden item\nClear filters')
            .get('.cutoff button')
            .click()
            .assertEmittedOnce('framework-reset-filters', 'jest-1')
            .ipcResetMockHistory()
            .ipcEvent('jest-1:ledger', this.ledger['jest-1'], this.statusMap['jest-1'])
            .ipcEvent('jest-1:refreshed', this.suites['jest-1'], this.suites['jest-1'].length)
            .get('@run')
            .assertNormalizedText('Run')
            .get('.cutoff')
            .should('not.exist')
            .get('@nuggets')
            .should('have.length', 15)
    })

    it('suites are deselected when not in view', function () {
        cy
            .startWithProject()
            .nextTick(() => {
                cy.stub(ipcRenderer, 'invoke', this.defaultResolver)
            })
            .ipcEvent('42:repositories', this.repositories)
            .ipcEvent('framework-active', 'jest-1', this.repositories[0])
            .nextTick()
            .ipcEvent('jest-1:refreshed', this.suites['jest-1'], this.suites['jest-1'].length)
            .ipcEvent(() => {
                const ledger = _.clone(this.ledger['jest-1'])
                const statusMap = _.clone(this.statusMap['jest-1'])
                ledger.idle -= 1
                ledger.failed += 1
                statusMap['/lodeapp/lode/hobnobs/__tests__/Console.spec.js'] = 'failed'

                return ['jest-1:ledger', ledger, statusMap]
            })
            .get('.actions .btn-primary').as('run')
            .assertNormalizedText('Run')
            .get('.filters .progress-breakdown > .Label')
            .each(el => {
                el.click()
            })
            .get('.framework > .children > .nugget').as('nuggets')
            .get('@nuggets').eq(0).find('> .header button')
            .click()
            .get('@nuggets').eq(1).find('> .header button')
            .click()
            .ipcResetMockHistory()
            .ipcEvent(() => {
                const ledger = _.clone(this.ledger['jest-1'])
                const statusMap = _.clone(this.statusMap['jest-1'])
                ledger.idle -= 1
                ledger.passed += 1
                statusMap['/lodeapp/lode/hobnobs/__tests__/Console.spec.js'] = 'passed'

                return ['jest-1:ledger', ledger, statusMap]
            })
            .nextTick()
            .assertEmittedOnce(
                'framework-select',
                'jest-1',
                ['/lodeapp/lode/hobnobs/__tests__/Console.spec.js'],
                false
            )
            .get('@run')
            .assertNormalizedText('Run selected 1')
            .get('.filters .progress-breakdown > .Label--selected')
            .assertNormalizedText('1 selected')
            .get('.filters .progress-breakdown > .Label--failed')
            .should('have.class', 'is-active')
            .assertNormalizedText('0 failed')
    })

    it('handles framework actions', function () {
        cy
            .startWithProject()
            .nextTick(() => {
                cy.stub(ipcRenderer, 'invoke', this.defaultResolver)
            })
            .ipcEvent('42:repositories', this.repositories)
            .ipcEvent('framework-active', 'jest-1', this.repositories[0])
            .nextTick()
            .ipcEvent('jest-1:refreshed', this.suites['jest-1'], this.suites['jest-1'].length)
            .ipcResetMockHistory()
            .get('.framework')
            .should('have.class', 'status--idle')
            .find('.title .status').as('status')
            .should('have.class', 'status--idle')
            .get('.framework > .header .actions').as('actions')
            .find('.more-actions')
            .click()
            // Third argument of context menu is positioning object,
            // so we can ignore that.
            .ipcInvocation(0).assertChannel('framework-context-menu')
            .ipcInvocation(0).assertArgEq(1, 'jest-1')
            .ipcResetMockHistory()
            .get('@actions').find('.btn-primary')
            .assertNormalizedText('Run')
            .click()
            .assertEmittedOnce('framework-start', 'jest-1')
            .get('.framework')
            // Without any IPC interaction, status of framework should be
            // optimistically set to "queued".
            .should('have.class', 'status--queued')
            .get('@status')
            .should('have.class', 'status--queued')
            .ipcResetMockHistory()
            .get('@actions').find('.btn-primary').as('run')
            .should('be.disabled')
            .get('@actions').find('.btn-sm:first').as('refresh')
            .should('be.disabled')
            .get('@actions').find('.btn-sm:last').as('stop')
            .assertNormalizedText('Stop')
            .should('not.be.disabled')
            .click()
            .assertEmittedOnce('framework-stop', 'jest-1')
            .ipcResetMockHistory()
            .ipcEvent('jest-1:status:list', 'idle', 'running')
            .get('@run')
            .should('not.be.disabled')
            .get('@refresh')
            .should('not.be.disabled')
            .click()
            .assertEmittedOnce('framework-refresh', 'jest-1')
            .ipcEvent('jest-1:status:list', 'idle', 'running')
            .get('.framework')
            .should('have.class', 'status--idle')
            .get('@status')
            .should('have.class', 'status--idle')
            .ipcResetMockHistory()
    })
})
