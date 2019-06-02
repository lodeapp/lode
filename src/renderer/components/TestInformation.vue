<template>
    <div class="test-information markdown-body">
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
                <tr v-if="typeof stats.first !== 'undefined'">
                    <td class="heading">First seen</td>
                    <td :title="firstSeen">{{ displayFirstSeen }}</td>
                </tr>
                <tr>
                    <td class="heading">Last run</td>
                    <td v-if="typeof stats.last !== 'undefined'" :title="lastRun">{{ displayLastRun }}</td>
                    <td v-else>Never</td>
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
import moment from 'moment'
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
        lastRun () {
            return moment(this.stats.last).format('MMMM Do YYYY, HH:mm:ss')
        },
        displayLastRun () {
            return moment(this.stats.last).fromNow()
        },
        firstSeen () {
            return moment(this.stats.first).format('MMMM Do YYYY, HH:mm:ss')
        },
        displayFirstSeen () {
            return moment(this.stats.first).fromNow()
        },
        ...mapGetters({
            displayStatus: 'status/display'
        })
    }
}
</script>
