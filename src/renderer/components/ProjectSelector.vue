<template>
    <div
        v-if="project"
        :key="$string.from({ id: project.id, name: project.name })"
        class="titlebar-button"
        @click.prevent="openMenu"
    >
        <button type="button">
            <div class="text">
                <div class="title">{{ project.name }}</div>
            </div>
            <Icon symbol="code" class="rotate-90" />
        </button>
    </div>
</template>

<script>
import { Menu } from '@main/menu'
import { state } from '@main/lib/state'

export default {
    name: 'ProjectSelector',
    props: {
        project: {
            type: [Object, Boolean],
            default: false
        }
    },
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
            this.menu = new Menu()

            state.get('projects').forEach(project => {
                this.menu.add({
                    label: project.name,
                    type: 'checkbox',
                    checked: project.id === this.project.id,
                    click: (menuItem) => {
                        // Don't toggle the item, unless it's the current project,
                        // as the switch might still be cancelled by the user. If
                        // switch project is confirmed, menu will be rebuilt anyway.
                        menuItem.checked = project.id === this.project.id
                        this.$root.switchProject(project.id)
                    }
                })
            })
            this.menu
                .separator()
                .add({
                    label: 'New Project…',
                    click: () => {
                        this.$root.addProject()
                    }
                })
        },
        openMenu (event) {
            if (!this.menu) {
                this.buildMenu()
            }

            this.menu.attachTo(this.$el).open()
        }
    }
}
</script>
