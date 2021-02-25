import { ipcRenderer } from 'electron'
import { Lode } from '@preload/lode'

context('Themes', () => {
    it('can use light theme on load and switch when notified', () => {
        cy
            .visit('/', {
                onBeforeLoad (win) {
                    win.Lode = Lode
                },
                onLoad (win) {
                    ipcRenderer.trigger('did-finish-load', {
                        theme: 'light',
                        version: '0.0.0',
                        focus: true
                    })
                }
            })
            .get('body')
            .should('have.class', 'theme-light')
            .then(() => {
                ipcRenderer.trigger('theme-updated', 'dark')
            })
            .get('body')
            .should('have.class', 'theme-dark')
            .then(() => {
                ipcRenderer.trigger('theme-updated', 'light')
            })
            .get('body')
            .should('have.class', 'theme-light')
    })

    it('can use dark theme on load', () => {
        cy
            .visit('/', {
                onBeforeLoad (win) {
                    win.Lode = Lode
                },
                onLoad (win) {
                    cy.spy(ipcRenderer, 'send')
                    ipcRenderer.trigger('did-finish-load', {
                        theme: 'dark',
                        version: '0.0.0',
                        focus: true
                    })
                }
            })
            .get('body')
            .should('have.class', 'theme-dark')
    })
})
