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
                <tr v-if="stats.first !== undefined">
                    <td class="heading">First seen</td>
                    <td :key="timeKey" :title="firstSeen">{{ displayFirstSeen() }}</td>
                </tr>
                <tr>
                    <td class="heading">Last run</td>
                    <td :key="timeKey" v-if="stats.last !== undefined" :title="lastRun">{{ displayLastRun() }}</td>
                    <td v-else>Never</td>
                </tr>
                <tr v-if="stats.duration !== undefined">
                    <td class="heading">Duration</td>
                    <td><Duration :ms="stats.duration" /></td>
                </tr>
                <tr v-if="stats.assertions !== undefined">
                    <td class="heading">Assertions</td>
                    <!-- @TODO: Number formatting -->
                    <td>{{ stats.assertions }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
import format from 'date-fns/format'
import formatDistanceToNow from 'date-fns/formatDistanceToNow'
import { isEmpty } from 'lodash'
import { labels } from '@lib/frameworks/status'
import Duration from '@/components/Duration.vue'

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
            return isEmpty(this.stats)
        },
        lastRun () {
            return format(new Date(this.stats.last), 'MMMM do yyyy, HH:mm:ss')
        },
        firstSeen () {
            return format(new Date(this.stats.first), 'MMMM do yyyy, HH:mm:ss')
        }
    },
    mounted () {
        this.timeInterval = window.setInterval(() => {
            this.timeKey = this.$string.random()
        }, 15000)
    },
    beforeUnmount () {
        window.clearInterval(this.timeInterval)
    },
    methods: {
        displayLastRun () {
            return formatDistanceToNow(new Date(this.stats.last), { addSuffix: true })
        },
        displayFirstSeen () {
            return formatDistanceToNow(new Date(this.stats.first), { addSuffix: true })
        }
    }
}
</script>
