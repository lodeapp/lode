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
            <Spinner v-if="status === 'refreshing' || status === 'running'" />
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
        }
    },
    computed: {
        ...mapGetters({
            displayStatus: 'status/display'
        })
    }
}
</script>
