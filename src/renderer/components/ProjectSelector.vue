<template>
    <div v-if="currentProject" :key="currentProject.id" class="titlebar-button" @click="openMenu">
        <button type="button">
            <div class="text">
                <div class="title">{{ currentProject.name }}</div>
            </div>
            <Icon symbol="code" class="rotate-90" />
        </button>
    </div>
</template>

<script>
import _sortBy from 'lodash/sortBy'
import { remote } from 'electron'
import { mapActions, mapGetters } from 'vuex'

export default {
    name: 'ProjectSelector',
    data () {
        return {
            menu: null
        }
    },
    computed: {
        ...mapGetters({
            projects: 'config/projects',
            currentProject: 'config/currentProject'
        })
    },
    updated () {
        this.buildMenu()
    },
    methods: {
        buildMenu () {
            const { Menu, MenuItem } = remote

            this.menu = new Menu()

            // Clone a simplified version of projects in config, so we can sort
            // them alphabetically by name and create menu items out of them.
            const projects = this.projects.map(({ id, name }) => ({ id, name }))
            _sortBy(projects, [project => {
                return this.$string.ascii(project.name)
            }]).forEach(project => {
                this.menu.append(new MenuItem({
                    label: project.name,
                    type: 'radio',
                    checked: project.id === this.currentProject.id,
                    click: () => {
                        // Clicking on current project doesn't have any effect.
                        if (project.id === this.currentProject.id) {
                            return false
                        }
                        this.switchProject(project.id)
                    }
                }))
            })
            this.menu.append(new MenuItem({ type: 'separator' }))
            this.menu.append(new MenuItem({
                label: 'New Project…',
                click: () => {
                    this.$modal.confirm('AddProject')
                        .catch(() => {})
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
