<template>
    <div class="progress-breakdown">
        <span v-if="framework.selective" class="Label Label--outline Label--selected">
            <span>{{ framework.selected.suites.length }}</span>
            {{ 'selected|selected' | plural(framework.selected.suites.length) }}
        </span>
        <template v-for="(count, status) in framework.ledger">
            <span class="Label Label--outline" :class="[`Label--${status}`]" v-if="count > 0" :key="status">
                <span>{{ count }}</span>
                {{ statusString[status] | plural(count) }}
            </span>
        </template>
    </div>
</template>

<script>
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
                idle: 'idle|idle'
            }
        }
    }
}
</script>
