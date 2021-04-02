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
                            {{ model.name }}
                        </span>
                    </h3>
                    <div class="actions">
                        <button type="button" class="btn-link more-actions" tabindex="-1" @click.prevent="onContextMenu">
                            <Icon symbol="three-bars" />
                        </button>
                        <button class="btn btn-sm" @click="refresh" :disabled="queued || running || refreshing" tabindex="-1">
                            <Icon symbol="sync" />
                        </button>
                        <button
                            class="btn btn-sm btn-primary"
                            :disabled="queued || running || refreshing || noResults"
                            tabindex="-1"
                            @click="start"
                        >
                            <template v-if="selected > 0">
                                Run selected
                                <span class="Counter">{{ selected }}</span>
                            </template>
                            <template v-else-if="isFiltering && !noResults">
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
                    <Ledger
                        v-if="total"
                        :id="model.id"
                        :selected="selected"
                        @total="updateTotal"
                    />
                    <template v-else>
                        <template v-if="queued">
                            Queued...
                        </template>
                        <template v-if="refreshing">
                            Refreshing...
                        </template>
                        <template v-if="!queued && !refreshing">
                            No tests loaded. <a href="#" @click.prevent="refresh">Refresh</a>.
                        </template>
                    </template>
                </div>
                <div v-if="total" class="filters search" :class="{ 'is-searching': keyword }">
                    <Icon symbol="search" />
                    <input
                        type="search"
                        class="form-control input-block input-sm"
                        placeholder="Filter items"
                        autocomplete="off"
                        autocorrect="off"
                        autocapitalize="off"
                        spellcheck="false"
                        v-model="keyword"
                    >
                </div>
                <div v-if="total" class="filters sort">
                    <span>
                        <template v-if="visible > 1">
                            {{ ':n item sorted by :0|:n items sorted by :0' | plural(visible) | set(displaySort) }}
                        </template>
                        <template v-else>
                            {{ ':n item|:n items' | plural(visible) }}
                        </template>
                    </span>
                </div>
            </div>
            <div class="children">
                <Nugget
                    v-for="suite in suites"
                    class="suite"
                    :key="suite.relative"
                    :model="suite"
                    :running="running"
                    :selectable="true"
                    @toggle="onChildToggle"
                    @select="onChildSelect"
                    @status="onChildStatus"
                    @activate="onChildActivation"
                    @context-menu="onChildContextMenu"
                >
                    <Filename :key="suite.relative" />
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
import _debounce from 'lodash/debounce'
import _findIndex from 'lodash/findIndex'
import _head from 'lodash/head'
import _isEmpty from 'lodash/isEmpty'
import { mapGetters } from 'vuex'
import { sortDisplayName } from '@lib/frameworks/sort'
import Filename from '@/components/Filename'
import Indicator from '@/components/Indicator'
import Ledger from '@/components/Ledger'
import HasFrameworkMenu from '@/components/mixins/HasFrameworkMenu'

export default {
    name: 'Framework',
    components: {
        Filename,
        Indicator,
        Ledger
    },
    mixins: [
        HasFrameworkMenu
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
            total: 0,
            selected: 0,
            status: this.model.status || 'idle',
            keyword: this.$store.getters['filters/all'](this.model.id)['keyword'] || ''
        }
    },
    computed: {
        running () {
            return this.status === 'running'
        },
        refreshing () {
            return this.status === 'refreshing'
        },
        queued () {
            return this.status === 'queued'
        },
        isFiltering () {
            return !_isEmpty(this.filters(this.model.id))
        },
        visible () {
            return this.suites.length
        },
        hidden () {
            return this.total - this.visible
        },
        noResults () {
            return this.hidden === this.total
        },
        canToggleTests () {
            return this.model.canToggleTests
        },
        statusFilters () {
            return this.filters(this.model.id)['status'] || []
        },
        sort () {
            return this.model.sort
        },
        displaySort () {
            return sortDisplayName(this.sort)
        },
        ...mapGetters({
            filters: 'filters/all',
            getStatus: 'status/nugget'
        })
    },
    watch: {
        keyword: _debounce(function (keyword) {
            this.setKeywordFilter(keyword)
        }, 300)
    },
    async mounted () {
        Lode.ipc
            .on(`${this.model.id}:ledger`, this.onLedgerEvent)
            .on(`${this.model.id}:status:list`, this.statusListener)
            .on(`${this.model.id}:refreshed`, this.onSuitesEvent)
            .on(`${this.model.id}:selective`, this.onSelectiveEvent)

        const { ledger, status } = await Lode.ipc.invoke('framework-get-ledger', this.model.id)
        this.$store.commit('ledger/SET', ledger)
        this.$store.commit('status/SET', status)

        this.getSuites()
        this.selected = this.model.selected
    },
    beforeDestroy () {
        Lode.ipc
            .removeAllListeners(`${this.model.id}:ledger`)
            .removeAllListeners(`${this.model.id}:status:list`)
            .removeAllListeners(`${this.model.id}:refreshed`)
            .removeAllListeners(`${this.model.id}:selective`)
    },
    methods: {
        async onLedgerEvent (event, ledger, status) {
            this.total = Object.values(ledger).reduce((a, b) => a + b, 0)
            this.$store.commit('ledger/SET', ledger)
            this.$store.commit('status/SET', status)
        },
        getSuites () {
            Lode.ipc.send('framework-suites', this.model.id)
        },
        statusListener (event, to, from) {
            this.status = to
        },
        onSuitesEvent (event, suites, total) {
            this.suites = suites
            this.total = total
            this.$emit('mounted')
            // If we're not filtering, update the suites' mapping key.
            if (!this.statusFilters.length) {
                this.$store.commit('context/SUITES', suites)
            }
        },
        onSelectiveEvent (event, selected) {
            this.selected = selected
        },
        refresh () {
            // Optimistically set status to "queued".
            this.status = 'queued'
            Lode.ipc.send('framework-refresh', this.model.id)
        },
        start () {
            // Optimistically set status to "queued".
            this.status = 'queued'
            Lode.ipc.send('framework-start', this.model.id)
        },
        stop () {
            Lode.ipc.send('framework-stop', this.model.id)
        },
        updateTotal (total) {
            this.total = total
        },
        onChildToggle (context, toggle) {
            Lode.ipc.send('framework-toggle-child', this.model.id, context, toggle)
        },
        onChildSelect (context, selected) {
            if (selected && !this.selected) {
                // Optimistically mark the framework as running selectively.
                // This allows us to show checkboxes on suites
                this.selected++
            }
            Lode.ipc.send('framework-select', this.model.id, context, selected)
            // If a suite has been deselected, it's possible we'll need to
            // remove it, in case we're filtering by selected status.
            if (this.statusFilters.length && !selected) {
                const file = _head(context)
                this.updateSuitePresence(this.getStatus(file), file, false)
            }
        },
        onChildActivation (context) {
            this.$emit('activate', context)
        },
        onChildStatus (to, from, file, selected) {
            // If a suite's status no longer fits the current filters, we'll
            // have to manually exclude it from the list.
            if (this.statusFilters.length) {
                this.updateSuitePresence(to, file, selected)
            }
        },
        onChildContextMenu (context) {
            Lode.ipc.send('nugget-context-menu', this.model.id, context)
        },
        updateSuitePresence (status, file, selected) {
            const index = _findIndex(this.suites, ['file', file])
            if (index > -1) {
                if (
                    this.statusFilters.indexOf(status) === -1 &&
                    ['queued', 'running'].indexOf(status) === -1 &&
                    (this.statusFilters.indexOf('selected') === -1 || !selected)
                ) {
                    this.suites.splice(index, 1)
                    if (selected) {
                        this.onChildSelect([file], false)
                    }
                }
            }
        },
        setKeywordFilter (keyword) {
            Lode.ipc.send('framework-filter', this.model.id, 'keyword', keyword)
            this.$store.commit('filters/SET', {
                id: this.model.id,
                filters: {
                    keyword
                }
            })
        },
        resetFilters () {
            Lode.ipc.send('framework-reset-filters', this.model.id)
            this.$store.commit('filters/RESET')
            this.keyword = ''
        }
    }
}
</script>
