<template>
    <div class="framework" :class="[`status--${framework.status}`]">
        <div class="header">
            <div class="title">
                <div class="status">
                    <span class="indicator"></span>
                </div>
                <h3>{{ framework.name }}</h3>
                <div class="float-right">
                    <button class="btn btn-sm" @click="refresh">
                        <Icon i="sync" />
                    </button>
                    <button
                        class="btn btn-sm btn-primary"
                        :disabled="running || refreshing"
                        @click="run"
                    >
                        {{ selective ? 'Run selected' : 'Run' }}
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
import { mapGetters, mapActions } from 'vuex'
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
        selectedSuiteCount () {
            return this.framework.selectedCount.suites
        },
        ...mapGetters({
            selective: 'tree/selective',
            displayStatus: 'status/display'
        })
    },
    watch: {
        selectedSuiteCount (count) {
            if (!count) {
                this.disableSelective()
            }
        }
    },
    methods: {
        async refresh () {
            await this.framework.refresh()
        },
        async run () {
            await this.framework.start(this.selective)
        },
        async stop () {
            await this.framework.stop()
        },
        ...mapActions({
            disableSelective: 'tree/disableSelective'
        })
    }
}
</script>
