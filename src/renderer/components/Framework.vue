<template>
    <div class="framework" :class="[`status--${status}`]">
        <div class="header">
            <div class="title">
                <span class="indicator"></span>
                <h3>{{ framework.name }}</h3>
                <div class="float-right">
                    <button class="btn btn-sm btn-primary" @click="run" :disabled="running">Run</button>
                    <button class="btn btn-sm btn-danger" @click="stop" :disabled="!running">Stop</button>
                    <button class="btn btn-sm" @click="refresh"><Icon i="sync" /></button>
                </div>
            </div>
            <div class="progress-bar">
                <span class="status">
                    {{ displayStatus(status) }}
                </span>
                <div class="float-right">
                    2555 tests, 0 selected
                </div>
                <!-- <br>Toggle by status -->
            </div>
            <transition>
                <div class="filter-bar" v-if="framework.suites.length > 1">
                    <input class="form-control input-block input-sm" placeholder="Filter tests">
                </div>
            </transition>
        </div>
        <Suite v-for="suite in framework.suites" :suite="suite" :key="suite.path" />
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
            selective: 'tree/selective',
            displayStatus: 'status/display'
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
