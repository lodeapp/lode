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

                ipcRenderer.trigger('42:repositories', this.repositories)
            })
            .nextTick(() => {
                expect(ipcRenderer.invoke).to.be.calledOnceWith('repository-frameworks', 'repository-1')
                ipcRenderer.invoke.resetHistory()
            })
            .get('.contents > main')
            .should('not.have.class', 'no-projects')
            .should('have.class', 'project')
            .get('.split')
            .should('have.class', 'empty')
            .get('.sidebar header .sidebar-header:first')
            .should('have.text', 'Project')
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
            .nextTick(() => {
                expect(ipcRenderer.send).to.be.calledWith('repository-toggle', 'repository-2', true)
                expect(ipcRenderer.invoke).to.be.calledOnceWith('repository-frameworks', 'repository-2')
            })
            .get('.sidebar section.scrollable .sidebar-item:last').as('last')
            .should('have.class', 'is-expanded')
            .click()
            .nextTick(() => {
                expect(ipcRenderer.send).to.be.calledWith('repository-toggle', 'repository-2', false)
                expect(ipcRenderer.invoke).to.be.callCount(1)
                ipcRenderer.invoke.resetHistory()
            })
            .get('@last')
            .should('not.have.class', 'is-expanded')
            .get('#list')
            .should('have.class', 'pane')
            .get('#list h2')
            .should('have.text', 'Scan for frameworks inside your repositories')
            .get('#list .cta .btn-primary')
            .should('have.text', 'Scan for frameworks')
            .click()
            .then(() => {
                expect(ipcRenderer.invoke.getCall(0).args[0]).to.equal('project-empty-repositories')
                expect(ipcRenderer.invoke.getCall(1).args).to.deep.equal(['repository-exists', 'repository-1'])
                expect(ipcRenderer.invoke.getCall(2).args[0]).to.equal('framework-types')
                expect(ipcRenderer.invoke.getCall(3).args).to.deep.equal(['repository-frameworks', 'repository-1'])
                expect(ipcRenderer.invoke.getCall(4).args[0]).to.equal('repository-scan')
                ipcRenderer.invoke.resetHistory()
            })
            .get('.modal-header')
            .should('have.text', 'Manage test frameworks')
            .get('.modal .repository-settings .repository-name')
            .should('contain.text', 'hobnobs')
            .get('.modal .repository-settings .counters')
            .should('contain.text', 'No frameworks')
            .get('.modal-footer .btn-primary')
            .should('contain.text', 'Save changes')
            .get('.modal-footer .btn:first')
            .should('contain.text', 'Cancel')
            .click()
            .then(() => {
                // After cancelling the previous scan, it should trigger
                // another set of invocations for the second repository.
                expect(ipcRenderer.invoke.getCall(0).args).to.deep.equal(['repository-exists', 'repository-2'])
                expect(ipcRenderer.invoke.getCall(1).args[0]).to.equal('framework-types')
                expect(ipcRenderer.invoke.getCall(2).args).to.deep.equal(['repository-frameworks', 'repository-2'])
                expect(ipcRenderer.invoke.getCall(3).args[0]).to.equal('repository-scan')
                ipcRenderer.invoke.resetHistory()
            })
            .get('.modal .repository-settings .repository-name')
            .should('contain.text', 'digestives')
            .get('.modal .repository-settings .counters')
            .should('contain.text', 'No frameworks')
            .get('.modal .repository-settings .btn')
            .should('contain.text', 'Scan')
            .click()
            .then(() => {
                expect(ipcRenderer.invoke.getCall(0).args[0]).to.equal('repository-scan')
                ipcRenderer.invoke.resetHistory()
            })
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

                ipcRenderer.trigger('42:repositories', this.repositories)
            })
            .nextTick(() => {
                expect(ipcRenderer.invoke).to.be.calledOnceWith('repository-frameworks', 'repository-1')
                ipcRenderer.invoke.resetHistory()
            })
            .get('.sidebar section.scrollable .sidebar-item')
            .should('have.length', 2)
            .get('.sidebar header .sidebar-header:last')
            .should('contain.text', 'Repositories')
            .get('.sidebar header .sidebar-action')
            // Force click because sidebar actions are hidden until hover.
            .click({ force: true })
            .get('.modal-header')
            .should('have.text', 'Add repositories to Biscuit')
            .get('.modal-footer .btn-primary')
            .should('contain.text', 'Add repositories')
            .should('have.prop', 'disabled')
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
            .then(() => {
                expect(ipcRenderer.invoke).to.be.calledOnceWith('project-add-repositories-menu')
                ipcRenderer.invoke.resetHistory()
            })
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
            .then(() => {
                expect(ipcRenderer.invoke.getCall(0).args).to.deep.equal(['repository-validate', { path: '' }])
                expect(ipcRenderer.invoke.getCall(1).args).to.deep.equal(['repository-validate', { path: 'rich-tea' }])
                expect(ipcRenderer.invoke.getCall(2).args).to.deep.equal(['repository-validate', { path: 'rich-tea' }])
                // After validating, the only repository to be added is the first unique path.
                expect(ipcRenderer.invoke.getCall(3).args).to.deep.equal(['repository-add', ['rich-tea']])
                expect(ipcRenderer.invoke.getCall(4).args).to.deep.equal(['repository-exists', 'repository-3'])
                expect(ipcRenderer.invoke.getCall(5).args[0]).to.equal('framework-types')
                expect(ipcRenderer.invoke.getCall(6).args).to.deep.equal(['repository-frameworks', 'repository-3'])
                expect(ipcRenderer.invoke.getCall(7).args[0]).to.equal('repository-scan')
                ipcRenderer.invoke.resetHistory()
            })
            .get('.modal-header')
            .should('have.text', 'Manage test frameworks')
            .get('.modal .repository-settings .repository-name')
            .should('contain.text', 'rich-tea')
            .get('.modal .repository-settings .counters')
            .should('contain.text', 'No frameworks')
            .get('.modal-footer .btn-primary')
            .should('contain.text', 'Save changes')
            .click()
            .then(() => {
                // Simulate project receiving the added repository
                ipcRenderer.trigger('42:repositories', this.repositories.concat(this.anotherRepository))
            })
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
            .then(() => {
                expect(ipcRenderer.invoke).to.have.callCount(2)
                expect(ipcRenderer.invoke.getCall(0).args).to.deep.equal(['repository-validate', { path: 'rich-tea' }])
                expect(ipcRenderer.invoke.getCall(1).args).to.deep.equal(['repository-add', ['rich-tea']])
                ipcRenderer.invoke.resetHistory()
            })
    })

    it('triggers repository context menu', function () {
        cy
            .startWithProject()
            .nextTick(() => {
                cy.stub(ipcRenderer, 'invoke').resolves(true)

                // Collapse all repositories to avoid calling for frameworks.
                ipcRenderer.trigger('42:repositories', this.repositories.map(repository => {
                    repository.expanded = false
                    return repository
                }))
            })
            .get('.sidebar section.scrollable .sidebar-item:first .name')
            .should('contain.text', 'hobnobs')
            .rightclick()
            .then(() => {
                expect(ipcRenderer.invoke).to.be.calledOnceWith('repository-context-menu', 'repository-1')
                ipcRenderer.invoke.resetHistory()
            })
            .get('.sidebar section.scrollable .sidebar-item:last .name')
            .should('contain.text', 'digestives')
            .rightclick()
            .then(() => {
                expect(ipcRenderer.invoke).to.be.calledOnceWith('repository-context-menu', 'repository-2')
            })
    })
})
