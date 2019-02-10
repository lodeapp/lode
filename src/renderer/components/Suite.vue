<template>
    <Nugget
        :model="suite"
        class="suite"
        :class="{
            'is-child-active': isChildActive,
            'has-context': hasContext,
            'child-has-context': childHasContext
        }"
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
            @open="openFile"
            @activate="onChildActivation"
            @deactivate="onChildDeactivation"
            @add-context="onChildAddContext"
            @remove-context="onChildRemoveContext"
        />
    </Nugget>
</template>

<script>
import * as Path from 'path'
import { pathExistsSync } from 'fs-extra'
import { Menu } from '@main/menu'
import Nugget from '@/components/Nugget'
import Filename from '@/components/Filename'
import Breadcrumb from '@/components/mixins/breadcrumb'
import Context from '@/components/mixins/context'

export default {
    name: 'Suite',
    components: {
        Nugget,
        Filename
    },
    mixins: [
        Breadcrumb,
        Context
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
        onContextMenu (event) {
            new Menu()
                .before(() => {
                    this.onAddContext()
                })
                .add({
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
                    label: __DARWIN__
                        ? this.remoteFilePath ? 'Copy Local File Path' : 'Copy File Path'
                        : this.remoteFilePath ? 'Copy local file path' : 'Copy file path',
                    click: () => {
                        this.$root.copyToClipboard(this.filePath)
                    },
                    enabled: this.fileExists
                })
                .addIf(this.remoteFilePath, {
                    label: __DARWIN__
                        ? 'Copy Remote File Path'
                        : 'Copy Remote file path',
                    click: () => {
                        this.$root.copyToClipboard(this.remoteFilePath)
                    }
                })
                .add({
                    label: __DARWIN__
                        ? 'Open with Default Program'
                        : 'Open with default program',
                    click: () => {
                        this.openFile()
                    },
                    enabled: this.canOpen()
                })
                .after(() => {
                    this.onRemoveContext()
                })
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
