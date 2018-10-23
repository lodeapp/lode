<template>
    <div class="progress-breakdown">
        <span v-if="framework.selective">{{ '1 selected|:n selected' | plural(framework.selectedCount.suites) }}</span>
        <template v-for="(count, status) in framework.ledger">
            <span v-if="count > 0" :key="status">
                <template v-if="status === 'passed'">{{ '1 passed|:n passed' | plural(count) }}</template>
                <template v-if="status === 'failed'">{{ '1 failed|:n failed' | plural(count) }}</template>
                <template v-if="status === 'incomplete'">{{ '1 incomplete|:n incomplete' | plural(count) }}</template>
                <template v-if="status === 'skipped'">{{ '1 skipped|:n skipped' | plural(count) }}</template>
                <template v-if="status === 'warning'">{{ '1 warning|:n warning' | plural(count) }}</template>
                <template v-if="status === 'partial'">{{ '1 partial|:n partial' | plural(count) }}</template>
                <template v-if="status === 'empty'">{{ '1 empty|:n empty' | plural(count) }}</template>
                <template v-if="status === 'idle'">{{ '1 idle|:n idle' | plural(count) }}</template>
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
    }
}
</script>
