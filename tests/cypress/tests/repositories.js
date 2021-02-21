import { ipcRenderer } from 'electron'
import { Lode } from '@preload/lode'

context('Repository management', () => {
    it('manages existing repositories', () => {
        cy.fixture('framework/repositories.json').then(repositories => {
            cy
                .visit('/', {
                    onBeforeLoad (win) {
                        win.Lode = Lode
                    },
                    onLoad (win) {
                        cy.spy(ipcRenderer, 'send')

                        // Stub invocations for this test
                        cy.stub(ipcRenderer, 'invoke', method => {
                            switch (method) {
                                case 'repository-frameworks':
                                    return []
                                case 'project-empty-repositories':
                                    return repositories
                                case 'repository-exists':
                                    return true
                                case 'framework-types':
                                    return Promise.resolve([
                                        {
                                            name: 'Jest',
                                            type: 'jest',
                                            command: 'yarn test',
                                            path: '',
                                            proprietary: {}
                                        }
                                    ])
                            }
                        })

                        ipcRenderer.trigger('did-finish-load', {
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
                .should(() => {
                    expect(ipcRenderer.send).to.be.calledWith('project-repositories', { id: '42', name: 'Biscuit' })
                })
                .then(() => {
                    ipcRenderer.trigger('42:repositories', repositories)
                })
                .wait(1)
                .should(() => {
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
                .wait(1)
                .should(() => {
                    expect(ipcRenderer.send).to.be.calledWith('repository-toggle', 'repository-2', true)
                    expect(ipcRenderer.invoke).to.be.calledOnceWith('repository-frameworks', 'repository-2')
                })
                .get('.sidebar section.scrollable .sidebar-item:last')
                .should('have.class', 'is-expanded')
                .click()
                .wait(1)
                .should(() => {
                    expect(ipcRenderer.send).to.be.calledWith('repository-toggle', 'repository-2', false)
                    expect(ipcRenderer.invoke).to.be.callCount(1)
                    ipcRenderer.invoke.resetHistory()
                })
                .should('not.have.class', 'is-expanded')
                .get('#list')
                .should('have.class', 'pane')
                .get('#list h2')
                .should('have.text', 'Scan for frameworks inside your repositories')
                .get('#list .cta .btn-primary')
                .should('have.text', 'Scan for frameworks')
                .click()
                .should(() => {
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
                .should(() => {
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
                .should(() => {
                    expect(ipcRenderer.invoke.getCall(0).args[0]).to.equal('repository-scan')
                    ipcRenderer.invoke.resetHistory()
                })
                .get('.modal-footer .btn-primary')
                .should('contain.text', 'Save changes')
                .click()
                .get('.modal-header')
                .should('not.exist')
        })
    })

    it.skip('can handle missing repositories', () => {
    })

    it('triggers repository context menu', () => {
        cy.fixture('framework/repositories.json').then(repositories => {
            cy
                .visit('/', {
                    onBeforeLoad (win) {
                        win.Lode = Lode
                    },
                    onLoad (win) {
                        cy.spy(ipcRenderer, 'send')
                        cy.stub(ipcRenderer, 'invoke').resolves(true)
                        ipcRenderer.trigger('did-finish-load', {
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
                .should(() => {
                    expect(ipcRenderer.send).to.be.calledWith('project-repositories', { id: '42', name: 'Biscuit' })
                })
                .then(() => {
                    // Collapse all repositories to avoid calling for frameworks.
                    ipcRenderer.trigger('42:repositories', repositories.map(repository => {
                        repository.expanded = false
                        return repository
                    }))
                })
                .wait(1)
                .get('.sidebar section.scrollable .sidebar-item:first .name')
                .should('contain.text', 'hobnobs')
                .rightclick()
                .should(() => {
                    expect(ipcRenderer.invoke).to.be.calledOnceWith('repository-context-menu', 'repository-1')
                    ipcRenderer.invoke.resetHistory()
                })
                .get('.sidebar section.scrollable .sidebar-item:last .name')
                .should('contain.text', 'digestives')
                .rightclick()
                .should(() => {
                    expect(ipcRenderer.invoke).to.be.calledOnceWith('repository-context-menu', 'repository-2')
                })
        })
    })
})
