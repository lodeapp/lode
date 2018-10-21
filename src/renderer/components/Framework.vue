<template>
    <div class="framework parent" :class="[`status--${framework.status}`, framework.selective ? 'selective' : '']">
        <div class="header">
            <div class="title">
                <div class="status">
                    <span class="indicator"></span>
                </div>
                <h3 class="heading">{{ framework.name }}</h3>
                <div class="float-right">
                    <button class="btn btn-sm" @click="refresh" :disabled="running || refreshing">
                        <Icon slug="sync" />
                    </button>
                    <button
                        class="btn btn-sm btn-primary"
                        :disabled="running || refreshing"
                        @click="run"
                    >
                        {{ framework.selective ? 'Run selected' : 'Run' }}
                    </button>
                    <button class="btn btn-sm btn-danger" @click="stop" :disabled="!running && !refreshing">Stop</button>
                </div>
            </div>
            <div class="progress-bar">
                <span class="status">
                    {{ displayStatus(framework.status) }}
                </span>
                <div class="float-right">
                    <TestCount :framework="framework" />
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
import TestCount from '@/components/TestCount'

export default {
    name: 'Framework',
    components: {
        Group,
        Suite,
        TestCount
    },
    props: {
        framework: {
            type: Object,
            required: true
        }
    },
    computed: {
        running () {
            return this.framework.status === 'running'
        },
        refreshing () {
            return this.framework.status === 'refreshing'
        },
        ...mapGetters({
            displayStatus: 'status/display'
        })
    },
    methods: {
        async refresh () {
            await this.framework.refresh()
        },
        async run () {
            await this.framework.start()
        },
        async stop () {
            await this.framework.stop()
        }
    }
}
</script>
