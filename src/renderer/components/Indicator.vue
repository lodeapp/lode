<template>
    <div
        class="status"
        :class="[`status--${status}`]"
        :aria-label="label"
        :title="label"
    >
        <span class="indicator">
            <Icon v-if="status === 'error'" symbol="issue-opened" />
            <Icon v-if="status === 'empty'" symbol="circle-slash" />
            <Icon v-if="status === 'missing'" symbol="question" />
            <span v-if="['loading', 'refreshing', 'running'].indexOf(status) > -1" class="spinner"></span>
        </span>
    </div>
</template>

<script>
import { labels } from '@lib/frameworks/status'

export default {
    name: 'Indicator',
    props: {
        status: {
            type: String,
            required: true
        }
    },
    data () {
        return {
            label: labels[this.status]
        }
    }
}
</script>
