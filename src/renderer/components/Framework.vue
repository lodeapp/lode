<template>
    <div class="framework parent" :class="[`status--${framework.status}`, framework.selective ? 'selective' : '']">
        <div class="header">
            <div class="title">
                <div class="status">
                    <span class="indicator" :title="displayStatus(framework.status)"></span>
                </div>
                <h3 class="heading">{{ framework.name }}</h3>
                <div class="float-right">
                    <button class="btn btn-sm" @click="refresh" :disabled="running || refreshing">
                        <Icon symbol="sync" />
                    </button>
                    <button
                        class="btn btn-sm btn-primary"
                        :disabled="running || refreshing"
                        @click="run"
                    >
                        {{ framework.selective ? 'Run selected' : 'Run' }}
                        <span v-if="framework.selective" class="Counter">{{ framework.selectedCount.suites }}</span>
                    </button>
                    <button class="btn btn-sm btn-danger" @click="stop" :disabled="!running && !refreshing">Stop</button>
                </div>
            </div>
            <div class="progress">
                <template v-if="refreshing">Refreshing...</template>
                <template v-else-if="framework.suites.length">
                    {{ '1 suite|:n suites' | plural(framework.suites.length) }}
                    <button
                        type="button"
                        class="ellipsis-expander"
                        :aria-expanded="framework.expandResults"
                        @click="framework.expandResults = !framework.expandResults"
                    >&hellip;</button>
                </template>
                <template v-else>
                    No tests loaded. <a href="#" @click.prevent="refresh">Refresh</a>.
                </template>
            </div>
            <transition>
                <div class="progress-breakdown" v-if="framework.expandResults">
                    <span v-if="framework.selective">{{ '1 selected|:n selected' | plural(framework.selectedCount.suites) }}</span>
                </div>
            </transition>
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
