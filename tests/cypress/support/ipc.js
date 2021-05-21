import electron from '../../mocks/electron'

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
        return new Promise((resolve) => {
            if (electron.ipcRenderer.send.resetHistory) {
                electron.ipcRenderer.send.resetHistory()
            }
            if (electron.ipcRenderer.invoke.resetHistory) {
                electron.ipcRenderer.invoke.resetHistory()
            }
            resolve()
        })
    })
})

Cypress.Commands.add('ipcInvocation', index => {
    cy.wrap(electron.ipcRenderer.invoke.getCall(index))
})

Cypress.Commands.add('ipcEmission', index => {
    cy.wrap(electron.ipcRenderer.send.getCall(index))
})
