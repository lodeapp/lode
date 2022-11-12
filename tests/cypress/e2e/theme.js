describe('Themes', () => {
    it('can use light theme on load and switch when notified', () => {
        cy
            .start()
            .get('html')
            .invoke('attr', 'data-color-mode')
            .should('equal', 'light')
            .get('html')
            .invoke('attr', 'data-light-theme')
            .should('equal', 'light')
            .get('html')
            .invoke('attr', 'data-dark-theme')
            .should('equal', 'dark_dimmed')
            .ipcEvent('theme-updated', 'dark')
            .get('html')
            .invoke('attr', 'data-color-mode')
            .should('equal', 'dark')
            .ipcEvent('theme-updated', 'light')
            .get('html')
            .invoke('attr', 'data-color-mode')
            .should('equal', 'light')
    })

    it('can use dark theme on load', () => {
        cy
            .start({ theme: 'dark' })
            .get('html')
            .invoke('attr', 'data-color-mode')
            .should('equal', 'dark')
    })
})
