<template>
    <div
        v-if="$root.project"
        :key="$string.from({ id: $root.project.id, name: $root.project.name })"
        class="titlebar-button"
        @click="openMenu"
    >
        <button type="button">
            <div class="text">
                <div class="title">{{ $root.project.name }}</div>
            </div>
            <Icon symbol="code" class="rotate-90" />
        </button>
    </div>
</template>

<script>
import { remote } from 'electron'
import { Config } from '@lib/config'
import { mapActions } from 'vuex'

export default {
    name: 'ProjectSelector',
    data () {
        return {
            menu: null
        }
    },
    updated () {
        this.buildMenu()
    },
    methods: {
        buildMenu () {
            const { Menu, MenuItem } = remote
            this.menu = new Menu()

            Config.get('projects').forEach(project => {
                this.menu.append(new MenuItem({
                    label: project.name,
                    type: 'radio',
                    checked: project.id === this.$root.project.id,
                    click: () => {
                        this.switchProject(project.id)
                    }
                }))
            })
            this.menu.append(new MenuItem({ type: 'separator' }))
            this.menu.append(new MenuItem({
                label: 'New Project…',
                click: () => {
                    this.$root.addProject()
                }
            }))
        },
        openMenu (event) {
            event.preventDefault()

            if (!this.menu) {
                this.buildMenu()
            }

            const { x, y, height } = this.$el.getBoundingClientRect()
            this.menu.popup({
                window: remote.getCurrentWindow(),
                x: Math.ceil(x),
                y: Math.ceil(y + height + 6)
            })
        },
        ...mapActions({
            switchProject: 'config/switchProject'
        })
    }
}
</script>
