<template>
    <div>
        <div
            class="framework has-status"
            :class="[
                `status--${status}`,
                selected > 0 ? 'selective' : ''
            ]"
        >
            <div class="header">
                <div class="title">
                    <Indicator :status="status" />
                    <h3 class="heading">
                        <span class="name">
                            {{ framework.name }}
                        </span>
                    </h3>
                    <div class="actions">
                        <button type="button" class="btn-link more-actions" tabindex="-1" @click.prevent="openMenu">
                            <Icon symbol="kebab-vertical" />
                        </button>
                        <button class="btn btn-sm" @click="refresh" :disabled="running || refreshing" tabindex="-1">
                            <Icon symbol="sync" />
                        </button>
                        <button
                            class="btn btn-sm btn-primary"
                            :disabled="running || refreshing || noResults"
                            tabindex="-1"
                            @click="start"
                        >
                            <template v-if="selected > 0">
                                Run selected
                                <span class="Counter">{{ selected }}</span>
                            </template>
                            <template v-else-if="filtering && !noResults">
                                {{ 'Run match|Run matches' | plural(suites.length) }}
                                <span class="Counter">{{ suites.length }}</span>
                            </template>
                            <template v-else>Run</template>
                        </button>
                        <button
                            class="btn btn-sm"
                            :disabled="!running && !refreshing && !queued"
                            @click="stop"
                        >
                            Stop
                        </button>
                    </div>
                </div>
                <div class="filters">
                    <template v-if="count > 0">
                        <Ledger :framework="framework" />
                    </template>
                    <template v-else-if="queued">
                        Queued...
                    </template>
                    <template v-else-if="refreshing">
                        Refreshing...
                    </template>
                    <template v-else>
                        No tests loaded. <a href="#" @click.prevent="refresh">Refresh</a>.
                    </template>
                </div>
                <div v-if="count" class="filters search" :class="{ 'is-searching': keyword }">
                    <Icon symbol="search" />
                    <input
                        type="search"
                        class="form-control input-block input-sm"
                        placeholder="Filter items"
                        v-model="keyword"
                    >
                </div>
                <div v-if="count" class="filters sort">
                    <button type="button" @click.prevent="onSortClick">
                        <template v-if="visible > 1">
                            {{ ':n item sorted by :0|:n items sorted by :0' | plural(visible) | set(displaySort) }}
                            <Icon symbol="chevron-down" />
                        </template>
                        <template v-else>
                            {{ ':n item|:n items' | plural(visible) }}
                        </template>
                    </button>
                </div>
            </div>
            <div class="children">
                <Nugget
                    v-for="suite in suites"
                    class="suite"
                    :model="suite"
                    :key="suite.file"
                    :running="running"
                    :selectable="true"
                    @toggle="onChildToggle"
                    @context-menu="onSuiteContextMenu"
                >
                    <Filename :key="suite.file" />
                </Nugget>
                <footer v-if="hidden" class="cutoff">
                    <div>
                        <div v-if="noResults">No results</div>
                        <div v-else>{{ ':n hidden item|:n hidden items' | plural(hidden) }}</div>
                        <button class="btn-link" @click="resetFilters"><strong>Clear filters</strong></button>
                    </div>
                    <span class="zigzag"></span>
                </footer>
            </div>
        </div>
    </div>
</template>

<script>
// @TODO: redo filtering
// import _debounce from 'lodash/debounce'
import { mapGetters } from 'vuex'
import { ipcRenderer } from 'electron'
import { Menu } from '@main/menu'
import { sortDisplayName } from '@lib/frameworks/sort'
import Filename from '@/components/Filename'
import Indicator from '@/components/Indicator'
import Ledger from '@/components/Ledger'
import HasFrameworkMenu from '@/components/mixins/HasFrameworkMenu'
import HasStatus from '@/components/mixins/HasStatus'

export default {
    name: 'Framework',
    components: {
        Filename,
        Indicator,
        Ledger
    },
    mixins: [
        HasFrameworkMenu,
        HasStatus
    ],
    props: {
        model: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            suites: [],
            selected: 0
        }
    },
    computed: {
        framework () {
            return this.model
        },
        count () {
            return this.suites.length
        },
        running () {
            return this.status === 'running'
        },
        refreshing () {
            return this.status === 'refreshing'
        },
        queued () {
            return this.status === 'queued'
        },
        filtering () {
            // @TODO: redo filtering
            // return this.framework.hasFilters()
            return false
        },
        visible () {
            return this.suites.length
        },
        hidden () {
            return this.count - this.visible
        },
        noResults () {
            return this.hidden === this.count
        },
        canToggleTests () {
            return this.framework.canToggleTests
        },
        // @TODO: redo filtering
        // keyword: {
        //     get () {
        //         return this.framework.getFilter('keyword')
        //     },
        //     set: _debounce(function (value) {
        //         this.framework.setFilter('keyword', value)
        //     }, 150)
        // },
        keyword () {
            return ''
        },
        // @TODO: redo sorting
        // sort: {
        //     get () {
        //         return this.framework.getSort()
        //     },
        //     set (value) {
        //         this.framework.setSort(value)
        //     }
        // },
        sort () {
            return 'name'
        },
        displaySort () {
            return sortDisplayName(this.sort)
        },
        ...mapGetters({
            frameworkContext: 'context/frameworkContext'
        })
    },
    created () {
        ipcRenderer
            .on(`${this.model.id}:error`, this.onErrorEvent)
            .on(`${this.model.id}:refreshed`, this.onSuitesEvent)
            .on('menu-event', this.onAppMenuEvent)

        this.getSuites()
    },
    beforeDestroy () {
        ipcRenderer
            .removeListener(`${this.model.id}:error`, this.onErrorEvent)
            .removeListener('menu-event', this.onAppMenuEvent)
            .removeListener(`${this.model.id}:refreshed`, this.onSuitesEvent)
    },
    methods: {
        getSuites () {
            ipcRenderer.send('framework-suites', this.frameworkContext)
        },
        onErrorEvent (event, payload) {
            this.$payload(payload, error => {
                console.log({ error })
                this.$alert.show({
                    message: this.$string.set('The process for **:0** terminated unexpectedly.', this.model.name),
                    // @TODO: receive troubleshooting message from framework itself in the main process.
                    // help: framework.troubleshoot(error),
                    type: 'error',
                    error
                })
            })
        },
        onSuitesEvent (event, payload) {
            this.$payload(payload, suites => {
                console.log('GOT SUITES', { suites })
                this.suites = suites
                this.$emit('mounted')
            })
        },
        refresh () {
            ipcRenderer.send('framework-refresh', this.frameworkContext)
        },
        start () {
            ipcRenderer.send('framework-start', this.frameworkContext)
        },
        stop () {
            ipcRenderer.send('framework-stop', this.frameworkContext)
        },
        onChildToggle (context, toggle) {
            ipcRenderer.send('framework-toggle-child', this.frameworkContext, context, toggle)
        },
        onChildSelect (selected, context) {
            console.log('selecting on framework', this.frameworkContext, selected, context)
            this.selected += (selected ? 1 : -1)
            ipcRenderer.send('framework-select', this.frameworkContext, selected, context)
        },
        onChildActivation (context) {
            this.$emit('activate', context)
        },
        onAppMenuEvent (event, { name, properties }) {
            if (!this.framework) {
                return
            }

            switch (name) {
                case 'run-framework':
                    ipcRenderer.send('framework-start', this.frameworkContext)
                    break
                case 'refresh-framework':
                    ipcRenderer.send('framework-refresh', this.frameworkContext)
                    break
                case 'stop-framework':
                    ipcRenderer.send('framework-stop', this.frameworkContext)
                    break
                case 'filter':
                    this.$el.querySelector('[type="search"]').focus()
                    break
                case 'framework-settings':
                    this.manage()
                    break
                case 'remove-framework':
                    this.remove()
                    break
            }
        },
        resetFilters () {
            this.framework.resetFilters()
        },
        filterSuite (suite) {
            this.keyword = `"${suite.getRelativePath()}"`
        },
        onSortClick () {
            const menu = new Menu()
            this.framework.getSupportedSorts().forEach(sort => {
                menu.add({
                    label: sortDisplayName(sort),
                    type: 'checkbox',
                    checked: sort === this.sort,
                    click: () => {
                        this.sort = sort
                    }
                })
            })
            menu
                .separator()
                .add({
                    label: 'Reverse',
                    type: 'checkbox',
                    checked: this.framework.isSortReverse(),
                    click: () => {
                        this.framework.setSortReverse()
                    }
                })
                .attachTo(this.$el.querySelector('.sort button'))
                .open()
        },
        onSuiteContextMenu (suite) {
            // @TODO: redo path
            // return this.suite.getFilePath()
            const filePath = suite.file
            const remoteFilePath = suite.file !== filePath ? suite.file : false
            new Menu()
                .add({
                    id: 'filter',
                    label: __DARWIN__ ? 'Filter this Item' : 'Filter this item',
                    click: () => {
                        this.filterSuite(suite)
                    }
                })
                .separator()
                .add({
                    id: 'copy-local',
                    label: __DARWIN__
                        ? remoteFilePath ? 'Copy Local File Path' : 'Copy File Path'
                        : remoteFilePath ? 'Copy local file path' : 'Copy file path',
                    click: () => {
                        this.$root.copyToClipboard(filePath)
                    },
                    enabled: this.fileExists(filePath)
                })
                .addIf(remoteFilePath, {
                    id: 'copy-remote',
                    label: __DARWIN__
                        ? 'Copy Remote File Path'
                        : 'Copy Remote file path',
                    click: () => {
                        this.$root.copyToClipboard(remoteFilePath)
                    }
                })
                .add({
                    id: 'reveal',
                    label: __DARWIN__
                        ? 'Reveal in Finder'
                        : __WIN32__
                            ? 'Show in Explorer'
                            : 'Show in your File Manager',
                    click: () => {
                        this.$root.revealFile(filePath)
                    }
                })
                .add({
                    id: 'open',
                    label: __DARWIN__
                        ? 'Open with Default Program'
                        : 'Open with default program',
                    click: () => {
                        this.openFile(filePath)
                    },
                    enabled: this.canOpen(filePath)
                })
                // @TODO: redo injecting context menu items
                // .addMultiple(this.suite.contextMenu())
                .separator()
                // @TODO: redo refreshing of metadata
                .add({
                    label: __DARWIN__
                        ? 'Refresh Metadata'
                        : 'Refresh metadata',
                    click: () => {
                        this.suite.resetMeta()
                        this.refresh()
                    },
                    // enabled: !!this.suite.getMeta()
                    enabled: false
                })
                .open()
        },
        fileExists (path) {
            return this.$fileystem.exists(path)
        },
        fileIsSafe (path) {
            return this.$fileystem.isSafe(path)
        },
        // This is used by the suite's children to see if they
        // can add an "open" item to their context menu.
        canOpen (path) {
            return this.fileIsSafe(path) && this.fileExists(path)
        },
        openFile (path) {
            this.$root.openFile(path)
        }
    }
}
</script>
