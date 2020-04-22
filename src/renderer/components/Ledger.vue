<template>
    <div class="progress-breakdown">
        <span
            class="Label Label--outline Label--selected"
            :class="[isActive('selected') ? 'is-active' : '']"
            @click="toggle('selected')"
        >
            <!-- @TODO: redo selective -->
            <!-- v-if="framework.isSelective() || isActive('selected')" -->
            <span>{{ selected.length }}</span>
            {{ 'selected|selected' | plural(selected.length) }}
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

export default {
    name: 'Ledger',
    props: {
        framework: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
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
        selected () {
            // @TODO: redo selected
            // return this.framework.getSelected().suites
            return []
        },
        ledger () {
            // Modify ledger to consolidate running and queued states.
            // @TODO: redo ledger
            // const ledger = _cloneDeep(this.framework.getLedger())
            const ledger = {}
            ledger['queued'] += ledger['running']
            delete ledger['running']
            return ledger
        },
        filters () {
            // @TODO: redo filtering
            // return this.framework.getFilter('status') || []
            return []
        }
    },
    methods: {
        isActive (status) {
            return this.filters.indexOf(status) > -1
        },
        toggle (status) {
            if (this.isActive(status)) {
                this.deactivate(status)
                return
            }
            this.activate(status)
        },
        activate (status) {
            const statuses = _cloneDeep(this.filters)
            this.framework.setFilter('status', statuses.concat([status]))
        },
        deactivate (status) {
            const statuses = _cloneDeep(this.filters)
            const index = statuses.indexOf(status)
            if (index > -1) {
                statuses.splice(index, 1)
                this.framework.setFilter('status', statuses)
            }
        }
    }
}
</script>
