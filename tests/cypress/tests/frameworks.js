import _ from 'lodash'
import { ipcRenderer } from 'electron'
import { Lode } from '@preload/lode'

describe('Repository management', () => {
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
            this.statusMap[framework.id] = suites.reduce((obj, item) => {
                return {
                    ...obj,
                    [item.file]: 'idle'
                }
            }, {})

            this.frameworks.push(framework)
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
            .visit('/', {
                onBeforeLoad (win) {
                    win.Lode = Lode
                },
                onLoad (win) {
                    cy.spy(ipcRenderer, 'send')

                    // Stub invocations for this test
                    cy.stub(ipcRenderer, 'invoke', (method, ...args) => {
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
                    })

                    ipcRenderer.trigger('did-finish-load', {
                        theme: 'light',
                        projectId: '42',
                        version: '0.0.0',
                        focus: true
                    })
                }
            })
            .fixture('framework/project.json')
            .then(project => {
                ipcRenderer.trigger('project-ready', project)
            })
            .wait(1)
            .then(() => {
                ipcRenderer.trigger('42:repositories', this.repositories)
            })
            .wait(1)
            .then(() => {
                ipcRenderer.send.resetHistory()
                expect(ipcRenderer.invoke).to.be.calledWith('repository-frameworks', 'repository-1')
                ipcRenderer.invoke.resetHistory()

                ipcRenderer.trigger('framework-active', 'jest-1', this.repositories[0])
            })
            .wait(1)
            .then(() => {
                expect(ipcRenderer.send.getCall(0).args).to.deep.equal(['project-active-framework', 'jest-1'])
                expect(ipcRenderer.send.getCall(1).args).to.deep.equal(['framework-suites', 'jest-1'])
                ipcRenderer.send.resetHistory()
                expect(ipcRenderer.invoke.getCall(0).args).to.deep.equal(['repository-exists', 'repository-1'])
                expect(ipcRenderer.invoke.getCall(1).args).to.deep.equal(['framework-get', 'jest-1'])
                expect(ipcRenderer.invoke.getCall(2).args).to.deep.equal(['framework-get-ledger', 'jest-1'])
                ipcRenderer.invoke.resetHistory()

                ipcRenderer.trigger('jest-1:refreshed', this.suites['jest-1'], this.suites['jest-1'].length)
            })
            .wait(1)
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
            .should('have.prop', 'disabled')
            .get('.filters .progress-breakdown .Label')
            .should('have.length', 1)
            .get('.filters .progress-breakdown .Label--idle')
            .should(el => {
                expect(el.get(0).innerText).to.eq('15 idle')
            })
            .get('.search')
            .should('exist')
            .get('.sort')
            .should('contain.text', '15 items sorted by Name')
            .get('.framework .children .nugget')
            .should('have.length', 15)
            .get('.framework .children .nugget.is-collapsed.has-children')
            .should('have.length', 15)
            .get('.framework .children .nugget:first .filename > .dir')
            .should('have.text', '__tests__/')
            .get('.framework .children .nugget:first .filename > .name')
            .should('have.text', 'BadlyNested.spec.js')
            // Switch framework
            .get('.sidebar section.scrollable .sidebar-item--framework:last')
            .click()
            .then(() => {
                expect(ipcRenderer.send.getCall(0).args).to.deep.equal(['project-active-framework', 'phpunit-1'])
                expect(ipcRenderer.send.getCall(1).args).to.deep.equal(['framework-suites', 'phpunit-1'])
                ipcRenderer.send.resetHistory()
                expect(ipcRenderer.invoke.getCall(0).args).to.deep.equal(['repository-exists', 'repository-1'])
                expect(ipcRenderer.invoke.getCall(1).args).to.deep.equal(['framework-get', 'phpunit-1'])
                expect(ipcRenderer.invoke.getCall(2).args).to.deep.equal(['framework-get-ledger', 'phpunit-1'])
                ipcRenderer.invoke.resetHistory()

                ipcRenderer.trigger('phpunit-1:refreshed', this.suites['phpunit-1'], this.suites['phpunit-1'].length)
            })
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
            .should('have.prop', 'disabled')
            .get('.filters .progress-breakdown .Label')
            .should('have.length', 1)
            .get('.filters .progress-breakdown .Label--idle')
            .should(el => {
                expect(el.get(0).innerText).to.eq('14 idle')
            })
            .get('.search')
            .should('exist')
            .get('.sort')
            .should('contain.text', '14 items sorted by Running order')
            .get('.framework .children .nugget')
            .should('have.length', 14)
            .get('.framework .children .nugget.is-collapsed')
            .should('have.length', 14)
            .get('.framework .children .nugget.has-children')
            .should('have.length', 13)
            .get('.framework .children .nugget:not(.has-children) .filename > .name')
            .should('have.text', 'EmptyTest.php')
            .get('.framework .children .nugget:first .filename > .dir')
            .should('have.text', 'tests/Unit/')
            .get('.framework .children .nugget:first .filename > .name')
            .should('have.text', 'ConsoleTest.php')
            .click()
            .should(() => {
                expect(ipcRenderer.send).to.be.calledOnceWith(
                    'framework-toggle-child',
                    'phpunit-1',
                    ['/lodeapp/lode/hobnobs/tests/Unit/ConsoleTest.php'],
                    true
                )
                ipcRenderer.send.resetHistory()
            })
            .wait(1)
            .then(() => {
                ipcRenderer.trigger(
                    '/lodeapp/lode/hobnobs/tests/Unit/ConsoleTest.php:framework-tests',
                    this.tests['phpunit-1']['/lodeapp/lode/hobnobs/tests/Unit/ConsoleTest.php']
                )
            })
            .get('.framework .children .nugget:eq(1) .filename > .name')
            .should('have.text', 'DataProviderTest.php')
            .click()
            .should(() => {
                expect(ipcRenderer.send).to.be.calledOnceWith(
                    'framework-toggle-child',
                    'phpunit-1',
                    ['/lodeapp/lode/hobnobs/tests/Unit/DataProviderTest.php'],
                    true
                )
                ipcRenderer.send.resetHistory()
            })
            .wait(1)
            .then(() => {
                ipcRenderer.trigger(
                    '/lodeapp/lode/hobnobs/tests/Unit/DataProviderTest.php:framework-tests',
                    this.tests['phpunit-1']['/lodeapp/lode/hobnobs/tests/Unit/DataProviderTest.php']
                )
            })
            .get('.framework .children > .nugget:first')
            .should('have.class', 'is-expanded')
            .find('.nugget-items > .nugget')
            .should('have.length', 8)
            .should('have.class', 'test')
            .should('have.class', 'status--idle')
            .should('have.class', 'is-collapsed')
            .get('.framework .children > .nugget:first .nugget-items > .nugget:first')
            .find('.test-name')
            .should('have.text', 'Console log null')
            .get('.framework .children > .nugget:eq(1)')
            .should('have.class', 'is-expanded')
            .find('.nugget-items > .nugget')
            .should('have.length', 9)
            .should('have.class', 'test')
            .should('have.class', 'status--idle')
            .should('have.class', 'is-collapsed')
            .get('.framework .children > .nugget:eq(1) .nugget-items > .nugget:first')
            .find('.test-name')
            .should('have.text', 'Data provider success with data set # 0')
            .get('.framework .children > .nugget:eq(1) > .header')
            .click()
            .should(() => {
                expect(ipcRenderer.send).to.be.calledOnceWith(
                    'framework-toggle-child',
                    'phpunit-1',
                    ['/lodeapp/lode/hobnobs/tests/Unit/DataProviderTest.php'],
                    false
                )
                ipcRenderer.send.resetHistory()
            })
            .parent()
            .should('have.class', 'is-collapsed')
            .get('.framework .children .nugget.is-expanded')
            .should('have.length', 1)
    })
})
