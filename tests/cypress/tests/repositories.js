const { ipcRenderer } = window.electron

describe('Repository management', () => {
    beforeEach(function () {
        cy
            .fixture('framework/repositories.json').then(repositories => {
                // Artificially constrain the repositories array with two,
                // leaving the third one for us to use when needed.
                const anotherRepository = repositories.pop()
                this.repositories = repositories
                this.anotherRepository = anotherRepository
            })
            .fixture('framework/types.json').then(frameworkTypes => {
                this.frameworkTypes = frameworkTypes
            })
    })

    it('manages existing repositories', function () {
        cy
            .startWithProject()
            .nextTick(() => {
                // Stub invocations for this test
                cy.stub(ipcRenderer, 'invoke', method => {
                    switch (method) {
                        case 'repository-frameworks':
                            return []
                        case 'project-empty-repositories':
                            return this.repositories
                        case 'repository-exists':
                            return true
                        case 'framework-types':
                            return Promise.resolve(this.frameworkTypes)
                    }
                })
            })
            .ipcEvent('42:repositories', this.repositories)
            .nextTick()
            .assertInvokedOnce('repository-frameworks', 'repository-1')
            .ipcResetMockHistory()
            .get('.contents > main')
            .should('not.have.class', 'no-projects')
            .should('have.class', 'project')
            .get('.split')
            .should('have.class', 'empty')
            .get('.sidebar header .sidebar-header:first')
            .assertText('Project')
            .get('.sidebar section.scrollable .sidebar-item:first')
            .should('have.class', 'status--idle')
            .should('have.class', 'is-expanded')
            .get('.sidebar section.scrollable .sidebar-item:first .name')
            .should('contain.text', 'hobnobs')
            .get('.sidebar section.scrollable .sidebar-item:last')
            .should('have.class', 'status--idle')
            .should('not.have.class', 'is-expanded')
            .get('.sidebar section.scrollable .sidebar-item:last .name')
            .should('contain.text', 'digestives')
            // Toggle repository expansion from a couple of
            // different elements.
            .click()
            .nextTick()
            .assertEmittedOnce('repository-toggle', 'repository-2', true)
            .assertInvokedOnce('repository-frameworks', 'repository-2')
            .get('.sidebar section.scrollable .sidebar-item:last').as('last')
            .should('have.class', 'is-expanded')
            .click()
            .assertEmitted('repository-toggle', 'repository-2', false)
            .assertInvokedCount(1)
            .ipcResetMockHistory()
            .get('@last')
            .should('not.have.class', 'is-expanded')
            .get('#list')
            .should('have.class', 'pane')
            .get('#list h2')
            .assertText('Scan for frameworks inside your repositories')
            .get('#list .cta .btn-primary')
            .assertText('Scan for frameworks')
            .click()
            .then(() => {
            })
            .ipcInvocation(0).assertChannel('project-empty-repositories')
            .ipcInvocation(1).assertArgs('repository-exists', 'repository-1')
            .ipcInvocation(2).assertChannel('framework-types')
            .ipcInvocation(3).assertArgs('repository-frameworks', 'repository-1')
            .ipcInvocation(4).assertChannel('repository-scan')
            .ipcResetMockHistory()
            .get('.modal-header')
            .assertText('Manage test frameworks')
            .get('.modal .repository-settings .repository-name')
            .should('contain.text', 'hobnobs')
            .get('.modal .repository-settings .counters')
            .should('contain.text', 'No frameworks')
            .get('.modal-footer .btn-primary')
            .should('contain.text', 'Save changes')
            .get('.modal-footer .btn:first')
            .should('contain.text', 'Cancel')
            .click()
            // After cancelling the previous scan, it should trigger
            // another set of invocations for the second repository.
            .ipcInvocation(0).assertArgs('repository-exists', 'repository-2')
            .ipcInvocation(1).assertChannel('framework-types')
            .ipcInvocation(2).assertArgs('repository-frameworks', 'repository-2')
            .ipcInvocation(3).assertChannel('repository-scan')
            .ipcResetMockHistory()
            .get('.modal .repository-settings .repository-name')
            .should('contain.text', 'digestives')
            .get('.modal .repository-settings .counters')
            .should('contain.text', 'No frameworks')
            .get('.modal .repository-settings .btn')
            .should('contain.text', 'Scan')
            .click()
            .then(() => {
                expect(ipcRenderer.invoke.getCall(0).args[0]).to.equal('repository-scan')
            })
            .ipcResetMockHistory()
            .get('.modal-footer .btn-primary')
            .should('contain.text', 'Save changes')
            .click()
            .get('.modal-header')
            .should('not.exist')
    })

    it('can add repositories through the sidebar', function () {
        cy
            .startWithProject()
            .nextTick(() => {
                // Stub invocations for this test
                cy.stub(ipcRenderer, 'invoke', method => {
                    switch (method) {
                        case 'repository-frameworks':
                            return []
                        case 'repository-validate':
                            return null
                        case 'repository-add':
                            return [this.anotherRepository]
                        case 'repository-exists':
                            return true
                        case 'framework-types':
                            return Promise.resolve(this.frameworkTypes)
                    }
                })
            })
            .ipcEvent('42:repositories', this.repositories)
            .nextTick()
            .assertInvokedOnce('repository-frameworks', 'repository-1')
            .ipcResetMockHistory()
            .get('.sidebar section.scrollable .sidebar-item')
            .should('have.length', 2)
            .get('.sidebar header .sidebar-header:last')
            .should('contain.text', 'Repositories')
            .get('.sidebar header .sidebar-action')
            // Force click because sidebar actions are hidden until hover.
            .click({ force: true })
            .get('.modal-header')
            .assertText('Add repositories to Biscuit')
            .get('.modal-footer .btn-primary')
            .should('contain.text', 'Add repositories')
            .should('be.disabled')
            .get('.modal-footer .btn:first')
            .should('contain.text', 'Cancel')
            .click()
            .get('.sidebar header .sidebar-action')
            .click({ force: true })
            .get('form.add-repositories input[type="text"]')
            .should('have.length', 1)
            .type('rich-tea')
            .get('.add-repositories .add-row')
            .click()
            .get('form.add-repositories input[type="text"]')
            .should('have.length', 2)
            .get('form.add-repositories .remove-row:last')
            .click()
            .get('form.add-repositories input[type="text"]')
            .should('have.length', 1)
            .eq(0)
            .should('have.value', 'rich-tea')
            .next()
            .click()
            .assertInvokedOnce('project-add-repositories-menu')
            .ipcResetMockHistory()
            .get('form.add-repositories input[type="text"]')
            .should('have.length', 1)
            .eq(0)
            .should('have.value', 'rich-tea')
            .get('form.add-repositories .remove-row:last')
            .click()
            .get('form.add-repositories input[type="text"]')
            .should('have.length', 1)
            .eq(0)
            .should('have.value', '')
            .type('rich-tea')
            // Add a duplicate row and an empty one before saving, to see if
            // we're correctly disambiguating repository paths.
            .get('.add-repositories .add-row')
            .click()
            .click()
            .get('form.add-repositories input[type="text"]')
            .eq(1)
            .type('rich-tea')
            .get('.modal-footer .btn-primary')
            // By default it should add and scan, unless we explicitly
            // disable the auto-scan feature.
            .click()
            .ipcInvocation(0).assertArgs('repository-validate', { path: '' })
            .ipcInvocation(1).assertArgs('repository-validate', { path: 'rich-tea' })
            .ipcInvocation(2).assertArgs('repository-validate', { path: 'rich-tea' })
            // After validating, the only repository to be added is the first unique path.
            .ipcInvocation(3).assertArgs('repository-add', ['rich-tea'])
            .ipcInvocation(4).assertArgs('repository-exists', 'repository-3')
            .ipcInvocation(5).assertChannel('framework-types')
            .ipcInvocation(6).assertArgs('repository-frameworks', 'repository-3')
            .ipcInvocation(7).assertChannel('repository-scan')
            .ipcResetMockHistory()
            .get('.modal-header')
            .assertText('Manage test frameworks')
            .get('.modal .repository-settings .repository-name')
            .should('contain.text', 'rich-tea')
            .get('.modal .repository-settings .counters')
            .should('contain.text', 'No frameworks')
            .get('.modal-footer .btn-primary')
            .should('contain.text', 'Save changes')
            .click()
            // Simulate project receiving the added repository
            .ipcEvent('42:repositories', this.repositories.concat(this.anotherRepository))
            .get('.sidebar section.scrollable .sidebar-item')
            .should('have.length', 3)
            .get('.sidebar section.scrollable .sidebar-item:last')
            .should('have.class', 'status--idle')
            .should('not.have.class', 'is-expanded')
            .get('.sidebar section.scrollable .sidebar-item:last .name')
            .should('contain.text', 'rich-tea')
            // Now we'll add another repository, this time without auto-scan
            .get('.sidebar header .sidebar-action')
            .click({ force: true })
            .get('form.add-repositories input[type="text"]')
            .type('rich-tea')
            .get('.auto-scan input[type="checkbox"]')
            .uncheck()
            // This is a bit flaky in CI, as its seems two modals can
            // occasionally co-exist, so force "last" button, just in case.
            .get('.modal-footer .btn-primary:last')
            .click()
            .assertInvokedCount(2)
            .ipcInvocation(0).assertArgs('repository-validate', { path: 'rich-tea' })
            .ipcInvocation(1).assertArgs('repository-add', ['rich-tea'])
    })

    it('triggers repository context menu', function () {
        cy
            .startWithProject()
            .nextTick(() => {
                cy.stub(ipcRenderer, 'invoke').resolves(true)
            })
            // Collapse all repositories to avoid calling for frameworks.
            .ipcEvent('42:repositories', this.repositories.map(repository => {
                repository.expanded = false
                return repository
            }))
            .get('.sidebar section.scrollable .sidebar-item:first .name')
            .should('contain.text', 'hobnobs')
            .rightclick()
            .assertInvokedOnce('repository-context-menu', 'repository-1')
            .ipcResetMockHistory()
            .get('.sidebar section.scrollable .sidebar-item:last .name')
            .should('contain.text', 'digestives')
            .rightclick()
            .assertInvokedOnce('repository-context-menu', 'repository-2')
    })
})
