describe('Themes', () => {
    it('can use light theme on load and switch when notified', () => {
        cy
            .start()
            .get('body')
            .should('have.class', 'theme-light')
            .ipcEvent('theme-updated', 'dark')
            .get('body')
            .should('have.class', 'theme-dark')
            .ipcEvent('theme-updated', 'light')
            .get('body')
            .should('have.class', 'theme-light')
    })

    it('can use dark theme on load', () => {
        cy
            .start({ theme: 'dark' })
            .get('body')
            .should('have.class', 'theme-dark')
    })
})
