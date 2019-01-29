<template>
    <div
        class="framework parent"
        :class="[
            `status--${framework.status}`,
            `is-${expandStatus}`,
            framework.selective ? 'selective' : ''
        ]"
    >
        <div class="header">
            <div class="title">
                <Indicator :status="framework.status" tooltip-orientation="ne" />
                <h3 class="heading">
                    <span class="toggle" @click="toggle">
                        <Icon :symbol="show ? 'chevron-down' : 'chevron-right'" />
                    </span>
                    {{ framework.name }}
                </h3>
                <div class="actions">
                    <button class="btn btn-sm" @click="refresh" :disabled="running || refreshing">
                        <Icon symbol="sync" />
                    </button>
                    <button
                        class="btn btn-sm btn-primary"
                        :disabled="running || refreshing"
                        @click="start"
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
                    <input type="search" class="form-control input-block input-sm" placeholder="Filter suites">
                </div> -->
            </div>
        </div>
        <template v-if="show">
            <Suite
                v-for="suite in framework.suites"
                :suite="suite"
                :running="running"
                :key="suite.id"
            />
        </template>
    </div>
</template>

<script>
import Indicator from '@/components/Indicator'
import Suite from '@/components/Suite'
import Ledger from '@/components/Ledger'

export default {
    name: 'Framework',
    components: {
        Indicator,
        Suite,
        Ledger
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
        refreshing () {
            return this.framework.status === 'refreshing'
        },
        queued () {
            return this.framework.status === 'queued'
        },
        expandStatus () {
            return this.show ? 'expanded' : 'collapsed'
        }
    },
    created () {
        this.framework.on('error', error => {
            this.$alert.show({
                message: this.$string.set('The process for **:0** terminated unexpectedly.', this.framework.name),
                help: this.framework.troubleshoot(error),
                type: 'error',
                pre: error
            })
        })

        this.framework.on('change', framework => {
            this.$emit('change', framework)
        })
    },
    methods: {
        toggle () {
            this.show = !this.show
        },
        refresh () {
            this.framework.refresh()
        },
        start () {
            this.$root.latest(
                this.$string.set(':0 framework run', this.framework.name),
                () => this.framework.start()
            )
        },
        async stop () {
            await this.framework.stop()
        }
    }
}
</script>
