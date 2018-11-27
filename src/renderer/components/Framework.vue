<template>
    <div class="framework parent" :class="[`status--${framework.status}`, framework.selective ? 'selective' : '']">
        <div class="header">
            <div class="title">
                <div class="status tooltipped tooltipped-ne tooltipped-align-left-1" :aria-label="displayStatus(framework.status)">
                    <span class="indicator"></span>
                </div>
                <h3 class="heading">{{ framework.name }}</h3>
                <div class="actions">
                    <button class="btn btn-sm" @click="refresh" :disabled="running || refreshing">
                        <Icon symbol="sync" />
                    </button>
                    <button
                        class="btn btn-sm btn-primary"
                        :disabled="running || refreshing"
                        @click="run"
                    >
                        {{ framework.selective ? 'Run selected' : 'Run' }}
                        <span v-if="framework.selective" class="Counter">{{ framework.selected.suites.length }}</span>
                    </button>
                    <button
                        class="btn btn-sm btn-danger"
                        :disabled="!running && !refreshing && !queued"
                        @click="stop"
                    >
                        Stop
                    </button>
                </div>
            </div>
            <div class="progress">
                <template v-if="refreshing">Refreshing...</template>
                <template v-else-if="queued">Queued...</template>
                <template v-else-if="!framework.suites.length && running">Preparing run...</template>
                <template v-else-if="framework.suites.length">
                    {{ '1 suite|:n suites' | plural(framework.suites.length) }}
                    <button
                        type="button"
                        class="ellipsis-expander"
                        :aria-expanded="framework.expandFilters"
                        @click="framework.expandFilters = !framework.expandFilters"
                    >&hellip;</button>
                </template>
                <template v-else>
                    No tests loaded. <a href="#" @click.prevent="refresh">Refresh</a>.
                </template>
            </div>
            <div v-if="framework.expandFilters" class="filters">
                <Ledger :framework="framework" />
                <!-- <div class="search" v-if="framework.suites.length > 1">
                    <input class="form-control input-block input-sm" placeholder="Filter suites">
                </div> -->
            </div>
        </div>
        <Suite
            v-for="suite in framework.suites"
            :suite="suite"
            :running="running"
            :key="suite.id"
        />
    </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Group from '@/components/Group'
import Suite from '@/components/Suite'
import Ledger from '@/components/Ledger'

export default {
    name: 'Framework',
    components: {
        Group,
        Suite,
        Ledger
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
        queued () {
            return this.framework.status === 'queued'
        },
        ...mapGetters({
            displayStatus: 'status/display'
        })
    },
    created () {
        this.framework.on('error', error => {
            this.$alert.show({
                message: this.$string.set('The process for **:0** terminated unexpectedly.', this.framework.name),
                troubleshoot: this.framework.troubleshoot(error),
                type: 'error',
                pre: error
            })
        })
    },
    methods: {
        refresh () {
            this.$queue.add(this.framework.queueRefresh())
        },
        run () {
            this.$queue.add(this.framework.queueStart())
        },
        async stop () {
            await this.framework.stop()
        }
    }
}
</script>
