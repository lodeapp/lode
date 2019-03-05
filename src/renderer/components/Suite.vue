<template>
    <Nugget
        :model="suite"
        class="suite"
        :class="{ 'is-child-active': isChildActive }"
        :has-children="suite.testsLoaded() && suite.hasChildren()"
        @contextmenu.native.stop.prevent="onContextMenu"
    >
        <template slot="header">
            <div class="selective-toggle" :class="{ disabled: running }" @mousedown.prevent.stop="onSelectiveClick">
                <button tabindex="-1" type="button" :disabled="running"></button>
                <input
                    type="checkbox"
                    tabindex="-1"
                    v-model="selected"
                    :indeterminate.prop="suite.partial"
                    :disabled="running"
                    @click.prevent
                    @mousedown.prevent
                    @mousedown.stop="onSelectiveClick"
                >
            </div>
            <Filename :path="relativePath" :key="relativePath" />
        </template>
        <Test
            v-for="test in suite.tests"
            :key="test.getId()"
            :test="test"
            :running="running"
            :selectable="canToggleTests"
            @open="openFile"
            @activate="onChildActivation"
        />
    </Nugget>
</template>

<script>
import * as Path from 'path'
import { pathExistsSync } from 'fs-extra'
import { Menu } from '@main/menu'
import { mapGetters } from 'vuex'
import Nugget from '@/components/Nugget'
import Filename from '@/components/Filename'

export default {
    name: 'Suite',
    components: {
        Nugget,
        Filename
    },
    props: {
        suite: {
            type: Object,
            required: true
        },
        running: {
            type: Boolean,
            default: false
        }
    },
    computed: {
        selected: {
            get () {
                return this.suite.selected
            },
            set (checked) {
                this.suite.toggleSelected(checked)
            }
        },
        canToggleTests () {
            return this.suite.canToggleTests
        },
        testsLoaded () {
            return this.suite.testsLoaded()
        },
        isChildActive () {
            return this.context.indexOf(this.suite.getId()) > -1
        },
        relativePath () {
            return this.suite.getRelativePath()
        },
        filePath () {
            return this.suite.getFilePath()
        },
        remoteFilePath () {
            return this.suite.file !== this.filePath ? this.suite.file : false
        },
        fileExists () {
            return pathExistsSync(this.filePath)
        },
        fileExtension () {
            return Path.extname(this.filePath)
        },
        fileIsSafe () {
            return this.$fileystem.isExtensionSafe(this.fileExtension)
        },
        ...mapGetters({
            context: 'context/active'
        })
    },
    methods: {
        onSelectiveClick (event) {
            if (this.running) {
                return
            }
            this.selected = !this.selected
        },
        onChildActivation (context) {
            context.unshift(this.suite)
            this.$store.commit('context/ADD', this.suite.getId())
            this.$emit('activate', context)
        },
        onContextMenu (event) {
            new Menu()
                .add({
                    id: 'reveal',
                    label: __DARWIN__
                        ? 'Reveal in Finder'
                        : __WIN32__
                            ? 'Show in Explorer'
                            : 'Show in your File Manager',
                    click: () => {
                        this.$root.revealFile(this.filePath)
                    },
                    enabled: this.fileExists
                })
                .add({
                    id: 'copy-local',
                    label: __DARWIN__
                        ? this.remoteFilePath ? 'Copy Local File Path' : 'Copy File Path'
                        : this.remoteFilePath ? 'Copy local file path' : 'Copy file path',
                    click: () => {
                        this.$root.copyToClipboard(this.filePath)
                    },
                    enabled: this.fileExists
                })
                .addIf(this.remoteFilePath, {
                    id: 'copy-remote',
                    label: __DARWIN__
                        ? 'Copy Remote File Path'
                        : 'Copy Remote file path',
                    click: () => {
                        this.$root.copyToClipboard(this.remoteFilePath)
                    }
                })
                .add({
                    id: 'open',
                    label: __DARWIN__
                        ? 'Open with Default Program'
                        : 'Open with default program',
                    click: () => {
                        this.openFile()
                    },
                    enabled: this.canOpen()
                })
                .addMultiple(this.suite.contextMenu())
                .open()
        },
        canOpen () {
            return this.fileIsSafe && this.fileExists
        },
        openFile () {
            this.$root.openFile(this.filePath)
        }
    }
}
</script>
