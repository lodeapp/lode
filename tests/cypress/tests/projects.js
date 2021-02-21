import { ipcRenderer } from 'electron'
import { Lode } from '@preload/lode'

context('Project management', () => {
    it('can add projects from the welcome screen', () => {
        cy
            .visit('/', {
                onBeforeLoad (win) {
                    win.Lode = Lode
                },
                onLoad (win) {
                    cy.spy(ipcRenderer, 'send')
                    ipcRenderer.trigger('did-finish-load', {
                        version: '0.0.0',
                        focus: true
                    })
                }
            })
            .get('body')
            .should('have.class', 'light')
            .should('have.class', 'is-focused')
            .then(() => {
                cy.log('Blur application')
                ipcRenderer.trigger('blur')
            })
            .get('body')
            .should('not.have.class', 'is-focused')
            .then(() => {
                cy.log('Focus application')
                ipcRenderer.trigger('focus')
            })
            .get('body')
            .should('have.class', 'is-focused')
            .get('.contents > main')
            .should('have.class', 'no-projects')
            .and('contain', 'Welcome to Lode')
            .get('.no-projects .btn.btn-primary')
            .should('have.text', 'Add your first project')
            .click({ scrollBehavior: false })
            .get('.modal-header')
            .should('have.text', 'Add project')
            .get('.modal-footer .btn-primary').as('save')
            .should('contain.text', 'Add project')
            .should('have.prop', 'disabled')
            // Since it's the first time this modal is shown, it should have
            // the help section explaining what a project is.
            .get('.modal-help')
            .should('contain.text', 'Projects allow you to group different repositories and run their tests all at once.')
            .get('#project-name')
            .type('Biscuit')
            .window().then(win => {
                // Before saving, project ready ephemeral listener should not exist.
                expect(ipcRenderer.listeners.once).to.eql({})
            })
            .get('@save')
            .click()
            .should(() => {
                expect(ipcRenderer.send).to.be.calledWith('project-switch', { name: 'Biscuit' })
            })
            .get('.loading')
            .should('be.visible')
            .get('.spinner')
            .should('be.visible')
            .fixture('framework/project.json')
            .then(project => {
                ipcRenderer.trigger('project-ready', project)
            })
            .wait(1)
            .should(() => {
                expect(ipcRenderer.send).to.be.calledWith('project-repositories', { id: '42', name: 'Biscuit' })
                ipcRenderer.trigger('42:repositories', [])
            })
            .get('.loading')
            .should('not.exist')
            .get('.spinner')
            .should('not.exist')
            .get('.modal-header')
            .should('have.text', 'Add repositories to Biscuit')
            .get('.modal-footer .btn:first')
            .click()
            .get('.modal-header')
            .should('not.exist')
            .get('.contents > main')
            .should('not.have.class', 'no-projects')
            .should('have.class', 'project')
            .get('.split')
            .should('have.class', 'empty')
            .get('.pane:first')
            .should('have.class', 'sidebar')
            .get('.sidebar header .sidebar-header')
            .should('have.text', 'Project')
            .get('.sidebar header .sidebar-item')
            .should('contain.text', 'Biscuit')
            .should('have.class', 'status--idle')
            .get('#list')
            .should('have.class', 'pane')
            .get('#list h2')
            .should('have.text', 'Add repositories to Biscuit')
            .get('#list .cta .btn-primary')
            .should('have.text', 'Add repositories')
            .click()
            .get('.modal-header')
            .should('have.text', 'Add repositories to Biscuit')
            .get('.modal-footer .btn-primary').as('save')
            .should('contain.text', 'Add repositories')
            .should('have.prop', 'disabled')
    })

    it('resumes existing projects', () => {
        cy
            .visit('/', {
                onBeforeLoad (win) {
                    win.Lode = Lode
                },
                onLoad (win) {
                    cy.spy(ipcRenderer, 'send')
                    ipcRenderer.trigger('did-finish-load', {
                        projectId: '42',
                        version: '0.0.0',
                        focus: true
                    })
                }
            })
            // Having a project ID should make the renderer enter loading
            // state instead of showing the Welcome screen.
            .get('.loading')
            .should('be.visible')
            .get('.spinner')
            .should('be.visible')
            .fixture('framework/project.json')
            .then(project => {
                ipcRenderer.trigger('project-ready', project)
            })
            .wait(1)
            .should(() => {
                expect(ipcRenderer.send).to.be.calledWith('project-repositories', { id: '42', name: 'Biscuit' })
                ipcRenderer.trigger('42:repositories', [])
            })
            .get('.loading')
            .should('not.exist')
            .get('.spinner')
            .should('not.exist')
            .get('.modal-header')
            .should('not.exist')
            .get('.contents > main')
            .should('not.have.class', 'no-projects')
            .should('have.class', 'project')
            .get('.split')
            .should('have.class', 'empty')
            .get('.pane:first')
            .should('have.class', 'sidebar')
            .get('.sidebar header .sidebar-header:last')
            .should('have.text', 'Project')
            .get('.sidebar header .sidebar-item')
            .should('contain.text', 'Biscuit')
            .should('have.class', 'status--idle')
            .get('#list')
            .should('have.class', 'pane')
            .get('#list h2')
            .should('have.text', 'Add repositories to Biscuit')
            .get('#list .cta .btn-primary')
            .should('have.text', 'Add repositories')
            .click()
            .get('.modal-header')
            .should('have.text', 'Add repositories to Biscuit')
            .get('.modal-footer .btn-primary').as('save')
            .should('contain.text', 'Add repositories')
            .should('have.prop', 'disabled')
    })

    it('triggers project context menu', () => {
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
                ipcRenderer.trigger('42:repositories', [])
            })
            .get('.sidebar header .sidebar-item')
            .should('contain.text', 'Biscuit')
            .rightclick()
            .should(() => {
                expect(ipcRenderer.invoke).to.be.calledOnceWith('project-context-menu')
            })
    })
})
