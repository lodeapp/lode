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

Cypress.Commands.add('ipcEvent', (...args) => {
    // Allow functions that resolve into arguments
    if (args.length === 1 && typeof args[0] === 'function') {
        args = args[0]()
    }

    cy.then(() => {
        electron.ipcRenderer.trigger(...args)
    })
})

Cypress.Commands.add('ipcResetMockHistory', () => {
    cy.then(() => {
        if (electron.ipcRenderer.send.resetHistory) {
            electron.ipcRenderer.send.resetHistory()
        }
        if (electron.ipcRenderer.invoke.resetHistory) {
            electron.ipcRenderer.invoke.resetHistory()
        }
    })
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

Cypress.Commands.add('assertInvoked', (...args) => {
    expect(electron.ipcRenderer.invoke).to.be.calledWith(...args)
})

Cypress.Commands.add('assertInvokedOnce', (...args) => {
    expect(electron.ipcRenderer.invoke).to.be.calledOnceWith(...args)
})

Cypress.Commands.add('assertInvokedCount', times => {
    expect(electron.ipcRenderer.invoke).to.be.callCount(times)
})

Cypress.Commands.add('assertSent', (...args) => {
    expect(electron.ipcRenderer.send).to.be.calledWith(...args)
})

Cypress.Commands.add('assertSentOnce', (...args) => {
    expect(electron.ipcRenderer.send).to.be.calledOnceWith(...args)
})

Cypress.Commands.add('assertSentCount', times => {
    expect(electron.ipcRenderer.send).to.be.calledOnceWith(times)
})

Cypress.Commands.add('assertText', { prevSubject: true }, (subject, string) => {
    cy
        .wrap(subject)
        .should(el => {
            expect(el.get(0).innerText).to.eq(string)
        })
})
