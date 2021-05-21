import electron from '../../mocks/electron'

Cypress.Commands.add('assertInvoked', (...args) => {
    expect(electron.ipcRenderer.invoke).to.be.calledWith(...args)
})

Cypress.Commands.add('assertInvokedOnce', (...args) => {
    expect(electron.ipcRenderer.invoke).to.be.calledOnceWith(...args)
})

Cypress.Commands.add('assertInvokedCount', times => {
    expect(electron.ipcRenderer.invoke).to.be.callCount(times)
})

Cypress.Commands.add('assertEmitted', (...args) => {
    expect(electron.ipcRenderer.send).to.be.calledWith(...args)
})

Cypress.Commands.add('assertEmittedOnce', (...args) => {
    expect(electron.ipcRenderer.send).to.be.calledOnceWith(...args)
})

Cypress.Commands.add('assertEmittedCount', times => {
    expect(electron.ipcRenderer.send).to.be.calledOnceWith(times)
})

Cypress.Commands.add('assertArgs', { prevSubject: true }, (subject, ...args) => {
    cy.then(() => {
        return new Promise((resolve) => {
            expect(subject.args).to.deep.equal(args)
            resolve()
        })
    })
})

Cypress.Commands.add('assertArgEq', { prevSubject: true }, (subject, index, value) => {
    cy.then(() => {
        return new Promise((resolve) => {
            expect(subject.args[index]).to.deep.equal(value)
            resolve()
        })
    })
})

Cypress.Commands.add('assertChannel', { prevSubject: true }, (subject, channel) => {
    cy.then(() => {
        return new Promise((resolve) => {
            expect(subject.args[0]).to.equal(channel)
            resolve()
        })
    })
})

Cypress.Commands.add('assertNormalizedText', { prevSubject: true }, (subject, string) => {
    cy
        .wrap(subject)
        .should(el => {
            expect(el.get(0).innerText.trim()).to.eq(string)
        })
})
