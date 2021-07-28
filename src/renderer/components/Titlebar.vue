<template>
    <header class="titlebar" :class="{ 'shortcut-mode': shortcut }">
        <div class="titlebar-drag"></div>
        <ul class="titlebar-menu">
            <li class="titlebar-logo">
                <img src="static/icons/gem.svg">
            </li>
            <li v-for="item in menu" :key="item">
                <button
                    type="button"
                    @mousedown.left="openSection(item.section)"
                    @keyup.down="openSection(item.section)"
                    @keyup.enter="openSection(item.section)"
                    @keyup.right="focusRight($event)"
                    @keyup.left="focusLeft($event)"
                    @blur="onSectionBlur"
                    v-html="item.label"
                ></button>
            </li>
        </ul>
        <div class="controls">
            <div class="control control-min" @click="minimize">
                <button type="button">
                    <svg aria-hidden="true" version="1.1" width="10" height="10">
                        <path d="M 0,5 10,5 10,6 0,6 Z" />
                    </svg>
                </button>
            </div>
            <div class="control control-max" @click="maximize">
                <button type="button">
                    <svg aria-hidden="true" version="1.1" width="10" height="10">
                        <path d="M 0,0 0,10 10,10 10,0 Z M 1,1 9,1 9,9 1,9 Z" />
                    </svg>
                </button>
            </div>
            <div class="control control-restore" @click="restore">
                <button type="button">
                    <svg aria-hidden="true" version="1.1" width="10" height="10">
                        <path d="m 2,1e-5 0,2 -2,0 0,8 8,0 0,-2 2,0 0,-8 z m 1,1 6,0 0,6 -1,0 0,-5 -5,0 z m -2,2 6,0 0,6 -6,0 z" />
                    </svg>
                </button>
            </div>
            <div class="control control-close" @click="close">
                <button type="button">
                    <svg aria-hidden="true" version="1.1" width="10" height="10">
                        <path d="M 0,0 0,0.7 4.3,5 0,9.3 0,10 0.7,10 5,5.7 9.3,10 10,10 10,9.3 5.7,5 10,0.7 10,0 9.3,0 5,4.3 0.7,0 Z" />
                    </svg>
                </button>
            </div>
        </div>
    </header>
    <div v-if="active" class="titlebar-backdrop"></div>
</template>

<script>
export default {
    props: {
        sections: {
            type: Array,
            required: true
        }
    },
    data () {
        return {
            active: false,
            forceShow: false,
            shortcut: false,
            accelerators: {}
        }
    },
    created () {
        this.menu = this.sections.map(section => {
            const accelerator = section.match(/&(\w{1})/)
            if (accelerator) {
                this.accelerators[accelerator.shift().replace(/&/, '').toLowerCase()] = section
            }
            return {
                section,
                label: section.replace(/&(\w{1})/, '<span class="accelerator">$1</span>')
            }
        })
        Lode.ipc
            .on('titlebar-menu-closed', (event, item) => {
                document.body.classList.remove('titlebar-active')
                this.toggleShortcutMode(false)
                this.hide()
                setTimeout(() => {
                    if (this.active === item) {
                        this.active = false
                    }
                }, 100)
            })
            .on('leave-full-screen', () => {
                this.toggleShortcutMode(false)
            })
    },
    mounted () {
        // Register on both keydown and keyup, but they will only run once
        // either on fullscreen (keyup) or not (keydown).
        document.addEventListener('keydown', this.altHandler)
        document.addEventListener('keyup', this.altHandler)
    },
    unmounted () {
        document.removeEventListener('keydown', this.altHandler)
        document.removeEventListener('keyup', this.altHandler)
    },
    methods: {
        minimize () {
            Lode.ipc.send('minimize')
        },
        maximize () {
            Lode.ipc.send('maximize')
        },
        restore () {
            Lode.ipc.send('maximize')
        },
        close () {
            Lode.ipc.send('close')
        },
        isFullscreen () {
            return document.body.classList.contains('is-fullscreen')
        },
        show () {
            if (this.isFullscreen()) {
                this.toggleShortcutMode(true)
                document.body.classList.remove('titlebar-hidden')
                this.forceShow = true
            }
        },
        hide () {
            if (this.isFullscreen()) {
                document.body.classList.add('titlebar-hidden')
                this.toggleShortcutMode(false)
                this.forceShow = false
            }
        },
        blur () {
            Array.from(this.$el.nextSibling.querySelectorAll('.titlebar-menu li button'))
                .forEach(button => {
                    button.blur()
                })
        },
        altHandler (event) {
            if (this.$input.isAltKey(event) && !this.$input.isRepeating(event)) {
                if (this.isFullscreen() && event.type === 'keyup') {
                    if (document.body.classList.contains('titlebar-hidden')) {
                        this.show()
                        return
                    }
                    this.hide()
                } else if (!this.isFullscreen() && event.type === 'keydown') {
                    this.toggleShortcutMode()
                }
            }
        },
        escapeHandler (event) {
            if (this.$input.isEscapeKey(event)) {
                this.toggleShortcutMode(false)
            }
        },
        acceleratorHandler (event) {
            if (Object.keys(this.accelerators).includes(event.key)) {
                this.openSection(this.accelerators[event.key])
            }
        },
        toggleShortcutMode (toggle) {
            this.shortcut = typeof toggle === 'undefined' ? !this.shortcut : toggle
            if (this.shortcut) {
                document.addEventListener('keydown', this.escapeHandler)
                document.addEventListener('keydown', this.acceleratorHandler)
                this.$nextTick(() => {
                    this.focusFirst()
                })
                return
            }
            document.removeEventListener('keydown', this.escapeHandler)
            document.removeEventListener('keydown', this.acceleratorHandler)
            this.blur()
        },
        focusFirst () {
            this.$el.nextSibling.querySelector('.titlebar-menu li button').focus()
        },
        focusLast () {
            this.$el.nextSibling.querySelector('.titlebar-menu :last-child button').focus()
        },
        focusRight (event) {
            const el = event.target.closest('li').nextElementSibling
            if (!el) {
                this.focusFirst()
                return
            }
            el.querySelector('button').focus()
        },
        focusLeft (event) {
            const el = event.target.closest('li').previousElementSibling
            if (el.classList.contains('titlebar-logo')) {
                this.focusLast()
                return
            }
            el.querySelector('button').focus()
        },
        onSectionBlur () {
            if (this.shortcut || this.forceShow) {
                setTimeout(() => {
                    if (!this.$el.nextSibling.querySelectorAll(':focus').length) {
                        this.toggleShortcutMode(false)
                        this.hide()
                    }
                }, 10)
            }
        },
        openSection (item) {
            if (this.active === item) {
                return
            }
            this.toggleShortcutMode(false)
            const el = this.$el.nextSibling.querySelectorAll('.titlebar-menu button')[this.sections.indexOf(item)]
            el.focus()
            this.active = item
            document.body.classList.add('titlebar-active')
            Lode.ipc.invoke('titlebar-menu', item, JSON.parse(JSON.stringify(el.getBoundingClientRect())))
        }
    }
}
</script>
