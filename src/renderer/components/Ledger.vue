<template>
    <div class="progress-breakdown">
        <span v-if="framework.isSelective()" class="Label Label--outline Label--selected">
            <span>{{ selected.length }}</span>
            {{ 'selected|selected' | plural(selected.length) }}
        </span>
        <template v-for="(count, status) in ledger">
            <span class="Label Label--outline" :class="[`Label--${status}`]" v-if="count > 0" :key="status">
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
            return this.framework.getSelected().suites
        },
        ledger () {
            // Modify ledger to consolidate running and queued states.
            const ledger = _cloneDeep(this.framework.ledger)
            ledger['queued'] += ledger['running']
            delete ledger['running']
            return ledger
        }
    }
}
</script>
