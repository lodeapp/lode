<template>
    <div class="framework" :class="groupClasses">
        <div class="header row">
            <div class="col-18">
                <h2 class="d-inline">{{ framework.name }}</h2>
                <span>
                    [
                    <span v-if="running">Running...</span>
                    <span v-else-if="refreshing">Refreshing...</span>
                    <span v-else-if="stopped">Stopped</span>
                    <span v-else-if="error">Error!</span>
                    <span v-else>{{ framework.status }}</span>
                    ]
                </span>
                <button @click="refresh">Refresh</button>
            </div>
            <div class="col-6 text-right">
                <button @click="run">Run</button>
                <button @click="stop">Stop</button>
            </div>
        </div>
        <ul v-show="show">
            <li v-for="suite in framework.suites" :key="suite.path">
                <Suite :suite="suite" />
            </li>
        </ul>
    </div>
</template>

<script>
import { mapGetters } from 'vuex'
import group from '@/mixins/group'
import Suite from '@/components/Suite'

export default {
    name: 'Framework',
    components: {
        Suite
    },
    mixins: [group],
    props: {
        framework: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            show: true,
            refreshing: false,
            running: false,
            stopped: false,
            error: false
        }
    },
    computed: {
        model () {
            return this.framework
        },
        status () {
            if (this.running) {
                return 'running'
            }
            if (this.refreshing) {
                return 'refreshing'
            }
            if (this.stopped) {
                return 'stopped'
            }
            if (this.error) {
                return 'error'
            }
            return this.framework.status
        },
        ...mapGetters({
            selective: 'tree/selective'
        })
    },
    methods: {
        refresh () {
            this.refreshing = true
            this.framework.refresh()
                .then(suites => {
                    // console.log('refreshed')
                })
                .catch((error) => {
                    console.log(error)
                    this.error = true
                })
                .then(() => {
                    this.refreshing = false
                })
            // const project = new Project()
            // project.glob()

            // const watcher = chokidar.watch(project.path, {
            //     ignored: /[\/\\]\./,
            //     persistent: true
            // })

            // watcher.on('raw', (event, path, details) => {
            //     // This event should be triggered everytime something happens.
            //     console.log('Raw event info:', event, path, details)
            // })
        },
        run () {
            this.running = true
            this.stopped = false
            this.error = false
            this.framework.start(this.selective)
                .then(() => {
                    // console.log('Framework finished run')
                })
                .catch((error) => {
                    console.log(error)
                    this.error = true
                })
                .then(() => {
                    this.running = false
                })
        },
        stop () {
            this.framework.stop()
                .then(() => {
                    this.stopped = true
                })
                .catch(() => {
                    this.error = true
                })
                .then(() => {
                    this.refreshing = false
                    this.running = false
                })
        }
    }
}
</script>
