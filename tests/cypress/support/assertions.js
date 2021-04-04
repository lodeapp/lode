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
        expect(subject.args).to.deep.equal(args)
    })
})

Cypress.Commands.add('assertArgEq', { prevSubject: true }, (subject, index, value) => {
    cy.then(() => {
        expect(subject.args[index]).to.deep.equal(value)
    })
})

Cypress.Commands.add('assertChannel', { prevSubject: true }, (subject, channel) => {
    cy.then(() => {
        expect(subject.args[0]).to.equal(channel)
    })
})

Cypress.Commands.add('assertText', { prevSubject: true }, (subject, string) => {
    cy
        .wrap(subject)
        .should(el => {
            expect(el.get(0).innerText.trim()).to.eq(string)
        })
})
