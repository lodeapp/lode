<template>
    <div>
        <div
            class="framework has-status"
            :class="[
                `status--${status}`,
                selective ? 'selective' : ''
            ]"
        >
            <div class="header">
                <div class="title">
                    <Indicator :status="status" />
                    <h3 class="heading">
                        <span class="name">
                            <!-- @TODO: redo display name -->
                            <!-- {{ framework.getDisplayName() }} -->
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
                            <template v-if="selective">
                                Run selected
                                <span class="Counter">{{ selected.suites.length }}</span>
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
                <Suite
                    v-for="suite in suites"
                    :suite="suite"
                    :running="running"
                    :key="suite.file"
                    @activate="onChildActivation"
                    @refresh="refresh"
                    @filter="filterSuite"
                />
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
import { ipcRenderer } from 'electron'
import { Menu } from '@main/menu'
import { sortDisplayName } from '@lib/frameworks/sort'
import Indicator from '@/components/Indicator'
import Suite from '@/components/Suite'
import Ledger from '@/components/Ledger'
import HasFrameworkMenu from '@/components/mixins/HasFrameworkMenu'
import HasStatus from '@/components/mixins/HasStatus'

export default {
    name: 'Framework',
    components: {
        Indicator,
        Ledger,
        Suite
    },
    mixins: [
        HasFrameworkMenu,
        HasStatus
    ],
    props: {
        repositoryId: {
            type: String,
            required: true
        },
        framework: {
            type: Object,
            required: true
        }
    },
    computed: {
        frameworkContext () {
            return {
                repository: this.repositoryId,
                framework: this.model.id
            }
        },
        model () {
            return this.framework
        },
        count () {
            return this.framework.suites.length
        },
        suites () {
            // @TODO: redo suite filtering
            // return this.framework.getSuites()
            return this.framework.suites
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
        selective () {
            // @TODO: redo is selective
            // return this.framework.isSelective()
            return false
        },
        selected () {
            return this.framework.getSelected()
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
        }
    },
    created () {
        ipcRenderer.on('menu-event', this.onAppMenuEvent)
    },
    mounted () {
        this.$emit('mounted')
    },
    beforeDestroy () {
        ipcRenderer.removeListener('menu-event', this.onAppMenuEvent)
    },
    methods: {
        refresh () {
            ipcRenderer.send('framework-refresh', this.frameworkContext)
        },
        start () {
            ipcRenderer.send('framework-start', this.frameworkContext)
        },
        async stop () {
            ipcRenderer.send('framework-stop', this.frameworkContext)
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
                    this.framework.start()
                    break
                case 'refresh-framework':
                    this.framework.refresh()
                    break
                case 'stop-framework':
                    this.framework.stop()
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
        }
    }
}
</script>
