<template>
    <div
        class="status"
        :class="[`status--${status}`]"
        :aria-label="displayStatus(status)"
        :title="displayStatus(status)"
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
import { mapGetters } from 'vuex'

export default {
    name: 'Indicator',
    props: {
        status: {
            type: String,
            required: true
        }
    },
    computed: {
        ...mapGetters({
            displayStatus: 'status/display'
        })
    }
}
</script>
