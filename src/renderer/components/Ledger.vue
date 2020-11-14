<template>
    <div class="progress-breakdown">
        <span
            v-if="selected > 0"
            class="Label Label--outline Label--selected"
            :class="[isActive('selected') ? 'is-active' : '']"
            @click="toggle('selected')"
        >
            <span>{{ selected }}</span>
            {{ 'selected|selected' | plural(selected) }}
        </span>
        <template v-for="(count, status) in ledger">
            <span
                v-if="count > 0 || isActive(status)"
                :key="status"
                class="Label Label--outline"
                :class="[`Label--${status}`, isActive(status) ? 'is-active' : '']"
                @click="toggle(status)"
            >
                <span>{{ count }}</span>
                {{ statusString[status] | plural(count) }}
            </span>
        </template>
    </div>
</template>

<script>
import _cloneDeep from 'lodash/cloneDeep'
import { mapGetters } from 'vuex'

export default {
    name: 'Ledger',
    props: {
        id: {
            type: String,
            required: true
        },
        selected: {
            type: Number,
            default: 0
        }
    },
    data () {
        return {
            base: {},
            statusString: {
                queued: 'queued|queued',
                passed: 'passed|passed',
                failed: 'failed|failed',
                incomplete: 'incomplete|incomplete',
                skipped: 'skipped|skipped',
                warning: 'warning|warning',
                partial: 'partial|partial',
                empty: 'empty|empty',
                idle: 'idle|idle',
                error: 'error|error'
            }
        }
    },
    computed: {
        ledger () {
            // Modify ledger to consolidate running and queued states.
            const ledger = _cloneDeep(this.base)
            ledger['queued'] += ledger['running']
            delete ledger['running']
            return ledger
        },
        statusFilters () {
            return this.filters(this.id)['status'] || []
        },
        ...mapGetters({
            filters: 'filters/all'
        })
    },
    async created () {
        Lode.ipc.on(`${this.id}:ledger`, this.onLedgerEvent)
        this.base = JSON.parse(await Lode.ipc.invoke('framework-get-ledger', this.id))
    },
    beforeDestroy () {
        Lode.ipc.removeAllListeners(`${this.id}:ledger`)
    },
    methods: {
        async onLedgerEvent (event, payload) {
            this.$payload(payload, ledger => {
                this.base = ledger
                this.$emit('total', Object.values(ledger).reduce((a, b) => a + b, 0))
            })
        },
        isActive (status) {
            return this.statusFilters.indexOf(status) > -1
        },
        toggle (status) {
            if (this.isActive(status)) {
                this.deactivate(status)
                return
            }
            this.activate(status)
        },
        activate (status) {
            this.setFilter(_cloneDeep(this.statusFilters).concat([status]))
        },
        deactivate (status) {
            const statuses = _cloneDeep(this.statusFilters)
            const index = statuses.indexOf(status)
            if (index > -1) {
                statuses.splice(index, 1)
                this.setFilter(statuses)
            }
        },
        setFilter (filter) {
            Lode.ipc.send('framework-filter', this.id, 'status', filter)
            this.$store.commit('filters/SET', {
                id: this.id,
                filters: {
                    status: filter
                }
            })
        }
    }
}
</script>
