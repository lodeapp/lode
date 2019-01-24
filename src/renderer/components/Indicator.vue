<template>
    <div
        class="status tooltipped tooltipped-align-left-1"
        :class="[`status--${status}`, `tooltipped-${tooltipOrientation}`]"
        :aria-label="displayStatus(status)"
    >
        <span class="indicator">
            <Icon v-if="status === 'error'" symbol="issue-opened" />
            <Icon v-if="status === 'empty'" symbol="circle-slash" />
            <Spinner v-if="status === 'refreshing'" />
        </span>
    </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Spinner from '@/components/Spinner'

export default {
    name: 'Indicator',
    components: {
        Spinner
    },
    props: {
        status: {
            type: String,
            required: true
        },
        tooltipOrientation: {
            type: String,
            default: 'se'
        }
    },
    computed: {
        ...mapGetters({
            displayStatus: 'status/display'
        })
    }
}
</script>
