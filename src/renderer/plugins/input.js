export default class Input {
    install (Vue, options) {
        Vue.prototype.$input = this
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
    isAuxiliaryKey (event) {
        return this.auxiliaryKeyCodes().indexOf(event.code) > -1
    }
    hasModifierKey (event) {
        return event.ctrlKey || event.metaKey || event.altKey || event.shiftKey
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
    modifiesContent (event) {
        return !this.isAuxiliaryAction(event) && !this.isAuxiliaryKey(event)
    }
    isTag (event, tag) {
        return event.target.tagName.toLowerCase() === tag.toLowerCase()
    }
    on (event, tag, callback) {
        event.preventDefault()
        if (this.isTag(event, tag)) {
            callback(event)
        }
    }
}
