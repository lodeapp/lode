import { ipcRenderer } from 'electron'
import { Lode } from '@preload/lode'

context('Welcome screen', () => {
    it('can add projects from the welcome screen', () => {
        cy
            .visit('/', {
                onBeforeLoad (win) {
                    win.Lode = Lode
                },
                onLoad (win) {
                    ipcRenderer.listeners['did-finish-load'](null, {
                        platform: 'darwin',
                        version: '0.0.0',
                        focus: true
                    })
                }
            })
            .get('body')
            .should('have.class', 'light')
            .should('have.class', 'platform-darwin')
            .should('have.class', 'is-focused')
            .then(() => {
                cy.log('Blur application')
                ipcRenderer.listeners['blur']()
            })
            .get('body')
            .should('not.have.class', 'is-focused')
            .then(() => {
                cy.log('Focus application')
                ipcRenderer.listeners['focus']()
            })
            .get('body')
            .should('have.class', 'is-focused')

        cy.screenshot()

        cy
            .get('.contents > div')
            .should('have.class', 'no-projects')
            .and('contain', 'Welcome to Lode')
            .get('.no-projects .btn.btn-primary')
            .should('have.text', 'Add your first project')
            .click({ scrollBehavior: false })

        cy.screenshot({ capture: 'viewport' })
    })
})
