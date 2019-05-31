<template>
    <div class="test-statistics markdown-body">
        <div v-if="isEmpty">Run the test at least once to gather information.</div>
        <table v-else>
            <colgroup>
                <col width="1%">
                <col width="99%">
            </colgroup>
            <tbody>
                <tr>
                    <td class="heading">Status</td>
                    <td>{{ displayStatus(status) }}</td>
                </tr>
                <tr v-if="typeof stats.duration !== 'undefined'">
                    <td class="heading">Duration</td>
                    <!-- @TODO: Duration component to show seconds, minutes, hours, etc -->
                    <td>{{ stats.duration }}ms</td>
                </tr>
                <tr v-if="typeof stats.assertions !== 'undefined'">
                    <td class="heading">Assertions</td>
                    <!-- @TODO: Number formatting -->
                    <td>{{ stats.assertions }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
import _isEmpty from 'lodash/isEmpty'
import { mapGetters } from 'vuex'

export default {
    name: 'TestInformation',
    props: {
        status: {
            type: String,
            default: 'idle'
        },
        stats: {
            type: Object,
            required: true
        }
    },
    computed: {
        isEmpty () {
            return _isEmpty(this.stats)
        },
        ...mapGetters({
            displayStatus: 'status/display'
        })
    }
}
</script>
