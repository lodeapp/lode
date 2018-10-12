<template>
    <div class="framework" :class="[`status--${framework.status}`]">
        <div class="header">
            <div class="title">
                <span class="indicator"></span>
                <h3>{{ framework.name }}</h3>
                <div class="float-right">
                    <button class="btn btn-sm btn-primary" @click="run" :disabled="running || noSuitesSelected">
                        {{ selective ? 'Run selected' : 'Run' }}
                    </button>
                    <button class="btn btn-sm btn-danger" @click="stop" :disabled="!running">Stop</button>
                    <button class="btn btn-sm" @click="refresh"><Icon i="sync" /></button>
                </div>
            </div>
            <div class="progress-bar">
                <span class="status">
                    {{ displayStatus(framework.status) }}
                </span>
                <div class="float-right">
                    {{ framework.selectedCount.suites }} | {{ framework.selectedCount.tests }}
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
            show: true
        }
    },
    computed: {
        running () {
            return this.framework.status === 'running'
        },
        noSuitesSelected () {
            return !this.framework.selectedCount.suites
        },
        ...mapGetters({
            selective: 'tree/selective',
            displayStatus: 'status/display'
        })
    },
    methods: {
        refresh () {
            this.framework.refresh()
        },
        run () {
            this.framework.start(this.selective)
        },
        stop () {
            this.framework.stop()
        }
    }
}
</script>
