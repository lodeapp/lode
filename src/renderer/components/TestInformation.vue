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
                    <td>{{ label }}</td>
                </tr>
                <tr v-if="typeof stats.first !== 'undefined'">
                    <td class="heading">First seen</td>
                    <td :key="timeKey" :title="firstSeen">{{ displayFirstSeen() }}</td>
                </tr>
                <tr>
                    <td class="heading">Last run</td>
                    <td :key="timeKey" v-if="typeof stats.last !== 'undefined'" :title="lastRun">{{ displayLastRun() }}</td>
                    <td v-else>Never</td>
                </tr>
                <tr v-if="typeof stats.duration !== 'undefined'">
                    <td class="heading">Duration</td>
                    <td><Duration :ms="stats.duration" /></td>
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
import { labels } from '@lib/frameworks/status'
import Duration from '@/components/Duration'

export default {
    name: 'TestInformation',
    components: {
        Duration
    },
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
    data () {
        return {
            label: labels[this.status],
            timeKey: this.$string.random(),
            timeInterval: null
        }
    },
    computed: {
        isEmpty () {
            return _isEmpty(this.stats)
        },
        lastRun () {
            return moment(this.stats.last).format('MMMM Do YYYY, HH:mm:ss')
        },
        firstSeen () {
            return moment(this.stats.first).format('MMMM Do YYYY, HH:mm:ss')
        }
    },
    mounted () {
        this.timeInterval = window.setInterval(() => {
            this.timeKey = this.$string.random()
        }, 15000)
    },
    beforeDestroy () {
        window.clearInterval(this.timeInterval)
    },
    methods: {
        displayLastRun () {
            return moment(this.stats.last).fromNow()
        },
        displayFirstSeen () {
            return moment(this.stats.first).fromNow()
        }
    }
}
</script>
