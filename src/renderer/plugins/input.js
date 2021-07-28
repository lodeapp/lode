export default class Input {
    install (app) {
        app.config.globalProperties.$input = this
    }
    auxiliaryKeyCodes () {
        return [
            'Alt',
            'AltLeft',
            'AltRight',
            'ArrowUp',
            'ArrowDown',
            'ArrowLeft',
            'ArrowRight',
            'CapsLock',
            'Control',
            'ControlLeft',
            'Enter',
            'Escape',
            'F1',
            'F2',
            'F3',
            'F4',
            'F5',
            'F6',
            'F7',
            'F8',
            'F9',
            'F10',
            'F11',
            'F12',
            'MetaLeft',
            'MetaRight',
            'Shift',
            'ShiftLeft',
            'ShiftRight',
            'Tab'
        ]
    }
    isEscapeKey (event) {
        return event.code === 'Escape'
    }
    isAltKey (event) {
        return event.key === 'Alt'
    }
    isAuxiliaryKey (event) {
        return this.auxiliaryKeyCodes().indexOf(event.code) > -1
    }
    hasModifierKey (event) {
        return event.ctrlKey || event.metaKey || event.altKey || event.shiftKey
    }
    hasCmdOrCtrl (event) {
        return (__WIN32__ && event.ctrlKey) || (!__WIN32__ && event.metaKey)
    }
    hasAltKey (event) {
        return event.altKey
    }
    isCopying (event) {
        return (event.ctrlKey || event.metaKey) && event.code === 'KeyC'
    }
    isSelectingAll (event) {
        return (event.ctrlKey || event.metaKey) && event.code === 'KeyA'
    }
    isRefreshing (event) {
        return (event.ctrlKey || event.metaKey) && event.code === 'KeyR'
    }
    isAuxiliaryAction (event) {
        return this.isCopying(event) || this.isSelectingAll(event) || this.isRefreshing(event)
    }
    isRightButton (event) {
        return event.which === 3 || event.button === 2
    }
    isNumeral (event) {
        return event.code.startsWith('Digit')
    }
    isCycleForward (event) {
        if (__WIN32__) {
            // Make sure shift-key isn't pressed, as it would overlap with
            // backwards cycle otherwise.
            return (event.code === 'Tab' && event.ctrlKey && !event.shiftKey) || (event.code === 'PageUp' && event.ctrlKey)
        } else if (event.metaKey) {
            return (event.code === 'BracketRight' && event.shiftKey) || (event.code === 'ArrowRight' && event.altKey)
        }
        return false
    }
    isCycleBackward (event) {
        if (__WIN32__) {
            return (event.code === 'Tab' && event.ctrlKey && event.shiftKey) || (event.code === 'PageDown' && event.ctrlKey)
        } else if (event.metaKey) {
            return (event.code === 'BracketLeft' && event.shiftKey) || (event.code === 'ArrowLeft' && event.altKey)
        }
        return false
    }
    modifiesContent (event) {
        return !this.isAuxiliaryAction(event) && !this.isAuxiliaryKey(event)
    }
    isTag (event, tag) {
        return event.target.tagName.toLowerCase() === tag.toLowerCase()
    }
    isRepeating (event) {
        return event.repeat
    }
    on (event, tag, callback) {
        event.preventDefault()
        if (this.isTag(event, tag)) {
            callback(event)
        }
    }
}
