<template>
    <Nugget
        :model="suite"
        class="suite"
        :class="{ 'is-child-active': isChildActive }"
        :has-children="suite.testsLoaded && suite.tests.length > 0"
        @contextmenu.native.stop.prevent="onContextMenu"
    >
        <template slot="header">
            <div class="selective-toggle" :class="{ disabled: running }" @click.stop="onSelectiveClick">
                <button type="button" :disabled="running"></button>
                <input type="checkbox" v-model="selected" :indeterminate.prop="suite.partial" :disabled="running">
            </div>
            <Filename :path="suite.relative" :key="suite.relative" />
        </template>
        <Test
            v-for="test in suite.tests"
            :key="test.id"
            :model="test"
            :running="running"
            :selectable="suite.canToggleTests"
            @activate="onChildActivation"
            @deactivate="onChildDeactivation"
        />
    </Nugget>
</template>

<script>
import { pathExists } from 'fs-extra'
import { clipboard, remote, shell } from 'electron'
import Nugget from '@/components/Nugget'
import Filename from '@/components/Filename'
import Breadcrumb from '@/components/mixins/breadcrumb'

export default {
    name: 'Suite',
    components: {
        Nugget,
        Filename
    },
    mixins: [
        Breadcrumb
    ],
    props: {
        model: {
            type: Object,
            required: true
        },
        running: {
            type: Boolean,
            default: false
        }
    },
    computed: {
        suite () {
            return this.model
        },
        selected: {
            get () {
                return this.suite.selected
            },
            set (checked) {
                this.suite.toggleSelected(checked)
            }
        }
    },
    methods: {
        onSelectiveClick (event) {
            if (this.running) {
                return
            }
            const input = this.$el.querySelector('.selective-toggle input')
            if (event.target !== input && !this.suite.selected) {
                input.click()
            }
        },
        async onContextMenu (event) {
            event.preventDefault()

            const path = this.suite.getFilePath()
            const fileExistsOnDisk = await pathExists(path)
            const remotePath = this.suite.file !== this.suite.getFilePath() ? this.suite.file : false

            const { Menu, MenuItem } = remote

            const menu = new Menu()
            menu.append(new MenuItem({
                label: __DARWIN__
                    ? 'Reveal in Finder'
                    : __WIN32__
                        ? 'Show in Explorer'
                        : 'Show in your File Manager',
                click: () => {
                    shell.showItemInFolder(path)
                },
                enabled: fileExistsOnDisk
            }))

            menu.append(new MenuItem({
                label: __DARWIN__
                    ? remotePath ? 'Copy Local File Path' : 'Copy File Path'
                    : remotePath ? 'Copy local file path' : 'Copy file path',
                click: () => {
                    clipboard.writeText(path)
                },
                enabled: fileExistsOnDisk
            }))

            if (remotePath) {
                menu.append(new MenuItem({
                    label: __DARWIN__
                        ? 'Copy Remote File Path'
                        : 'Copy Remote file path',
                    click: () => {
                        clipboard.writeText(remotePath)
                    }
                }))
            }

            menu.popup({
                window: remote.getCurrentWindow()
            })
        }
    }
}
</script>
