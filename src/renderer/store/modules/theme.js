import { OneHalfDark, OneHalfLight } from 'xterm-theme'

// xterm.js will process colors loaded as themes, so
// we need to give it hex colors as strings rather
// than CSS variables. So we'll set up the terminal
// theme as an application state, mutating it when
// theme changes from main process.
const getColors = theme => {
    if (theme === 'dark') {
        return {
            ...OneHalfDark,
            // Must match var(--secondary-background-color)
            background: '#22272e'
        }
    }

    return {
        ...OneHalfLight,
        // Must match var(--secondary-background-color)
        background: '#f6f8fa'
    }
}

export default {
    namespaced: true,
    state: {
        colors: {}
    },
    mutations: {
        SET (state, theme) {
            state.colors = getColors(theme)
        }
    },
    getters: {
        colors: state => {
            return state.colors
        }
    }
}
