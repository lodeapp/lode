<template>
    <div class="test-statistics markdown-body">
        <div v-if="isEmpty">No statistics to display.</div>
        <table v-else>
            <colgroup>
                <col width="1%">
                <col width="100%">
            </colgroup>
            <tbody>
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

export default {
    name: 'TestStatistics',
    props: {
        stats: {
            type: Object,
            required: true
        }
    },
    computed: {
        isEmpty () {
            return _isEmpty(this.stats)
        }
    }
}
</script>
