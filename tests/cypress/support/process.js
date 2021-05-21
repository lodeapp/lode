import { Lode } from '@preload/lode'
import electron from '../../mocks/electron'

Cypress.Commands.add('start', (options = {}) => {
    cy
        .visit('/', {
            onBeforeLoad (win) {
                win.Lode = Lode
            },
            onLoad (win) {
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
        .nextTick()
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

Cypress.Commands.add('nextTick', callback => {
    if (callback) {
        cy
            .wait(1)
            .then(callback)
            .wait(1)
    } else {
        cy
            .wait(1)
    }
})
