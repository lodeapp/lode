<template>
    <div class="framework">
        <h2 :class="[status]">
            {{ framework.name }}
            <span>
                [
                <span v-if="running">Running...</span>
                <span v-else-if="refreshing">Refreshing...</span>
                <span v-else-if="stopped">Stopped</span>
                <span v-else-if="error">Error!</span>
                <span v-else>{{ framework.status }}</span>
                ]
            </span>
        </h2>
        <button @click="refresh">Refresh</button>
        <button @click="run">Run</button>
        <button @click="stop">Stop</button>
        <ul>
            <li v-for="suite in framework.suites" :key="suite.path">
                <Suite :suite="suite" :selective="framework.selective" @selective="onSuiteSelective" />
            </li>
        </ul>
    </div>
</template>

<script>
import Suite from '@/components/Suite'

export default {
    name: 'Framework',
    components: {
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
        }
    },
    methods: {
        refresh () {
            this.refreshing = true
            this.framework.refresh().then(suites => {
                console.log('refreshed')
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
            this.framework.start()
                .then(() => {
                    console.log('Framework finished run')
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
                    console.log('Framework was halted successfully')
                })
                .catch(() => {
                    this.error = true
                })
        },
        onSuiteSelective () {
            this.framework.selective = true
            this.$emit('selective')
        }
    }
}
</script>
