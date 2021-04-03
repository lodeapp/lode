import { Lode } from '@preload/lode'
import electron from '../../mocks/electron'

window.electron = electron

Cypress.Commands.add('start', (options = {}) => {
    cy
        .visit('/', {
            onBeforeLoad (win) {
                win.Lode = Lode
            },
            onLoad (win) {
                if (options.onLoad) {
                    options.onLoad()
                }
                cy.spy(electron.ipcRenderer, 'send')
                electron.ipcRenderer.trigger('did-finish-load', {
                    ...{
                        theme: 'light',
                        version: '0.0.0',
                        focus: true
                    },
                    ...options
                })
            }
        })
})

Cypress.Commands.add('startWithProject', (options = {}) => {
    cy
        .start(options)
        .fixture('framework/project.json')
        .then(project => {
            electron.ipcRenderer.trigger('project-ready', project)
        })
        .wait(1)
})

Cypress.Commands.add('innerTextIs', { prevSubject: true }, (subject, string) => {
    cy
        .wrap(subject)
        .should(el => {
            expect(el.get(0).innerText).to.eq(string)
        })
})
