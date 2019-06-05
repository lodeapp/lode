<template>
    <div>
        <div
            class="framework has-status"
            :class="[
                `status--${framework.status}`,
                selective ? 'selective' : ''
            ]"
        >
            <div class="header">
                <div class="title">
                    <Indicator :status="framework.status" />
                    <h3 class="heading">
                        <span class="name">
                            {{ framework.getDisplayName() }}
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
                            class="btn btn-sm btn-danger"
                            :disabled="!running && !refreshing && !queued"
                            @click="stop"
                        >
                            Stop
                        </button>
                    </div>
                </div>
                <div class="filters">
                    <template v-if="!framework.empty()">
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
                <div v-if="framework.count()" class="filters search">
                    <input
                        type="search"
                        class="form-control input-block input-sm"
                        placeholder="Filter items"
                        v-model="keyword"
                    >
                </div>
                <div v-if="framework.count()" class="filters sort">
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
                    :key="suite.getId()"
                    @activate="onChildActivation"
                    @refresh="refresh"
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
import _debounce from 'lodash/debounce'
import { ipcRenderer } from 'electron'
import { Menu } from '@main/menu'
import { sortDisplayName } from '@lib/frameworks/sort'
import Indicator from '@/components/Indicator'
import Suite from '@/components/Suite'
import Ledger from '@/components/Ledger'
import HasFrameworkMenu from '@/components/mixins/HasFrameworkMenu'

export default {
    name: 'Framework',
    components: {
        Indicator,
        Ledger,
        Suite
    },
    mixins: [
        HasFrameworkMenu
    ],
    props: {
        framework: {
            type: Object,
            required: true
        }
    },
    computed: {
        suites () {
            return this.framework.getSuites()
        },
        running () {
            return this.framework.status === 'running'
        },
        refreshing () {
            return this.framework.status === 'refreshing'
        },
        queued () {
            return this.framework.status === 'queued'
        },
        selective () {
            return this.framework.isSelective()
        },
        selected () {
            return this.framework.getSelected()
        },
        filtering () {
            return this.framework.hasFilters()
        },
        visible () {
            return this.framework.getSuites().length
        },
        hidden () {
            return this.framework.count() - this.visible
        },
        noResults () {
            return this.hidden === this.framework.count()
        },
        keyword: {
            get () {
                return this.framework.getFilter('keyword')
            },
            set: _debounce(function (value) {
                this.framework.setFilter('keyword', value)
            }, 150)
        },
        sort: {
            get () {
                return this.framework.getSort()
            },
            set (value) {
                this.framework.setSort(value)
            }
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
            this.framework.refresh()
        },
        start () {
            this.framework.start()
        },
        async stop () {
            await this.framework.stop()
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
