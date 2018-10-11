<template>
    <div>
        <div class="framework">
            <h3>{{ framework.name }}</h3>
            <span v-if="running">Running...</span>
            <span v-else-if="refreshing">Refreshing...</span>
            <span v-else-if="stopped">Stopped</span>
            <span v-else-if="error">Error!</span>
            <span v-else>{{ framework.status }}</span>
            | Progress | Toggle by status
            <div>
                Filter [select filtered]
            </div>
        </div>
        <Group
            :model="framework"
            :expanded="true"
            :toggles="false"
        >
            <template slot="header">
                <div>
                    <button @click="refresh">Refresh</button>
                    2555 tests, 0 selected
                </div>
                <span class="text-right">
                    <button @click="run">Run</button>
                    <button @click="stop">Stop</button>
                </span>
            </template>
            <Suite v-for="suite in framework.suites" :suite="suite" :key="suite.path" />
        </Group>
    </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Group from '@/components/Group'
import Suite from '@/components/Suite'

export default {
    name: 'Framework',
    components: {
        Group,
        Suite
    },
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
