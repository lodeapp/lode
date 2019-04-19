<template>
    <div
        class="framework has-status"
        :class="[
            `status--${framework.status}`,
            framework.selective ? 'selective' : ''
        ]"
    >
        <div class="header">
            <div class="title">
                <Indicator :status="framework.status" />
                <h3 class="heading">
                    <span class="name">
                        {{ framework.name }}
                    </span>
                </h3>
                <div class="actions">
                    <button type="button" class="btn-link more-actions" @click.prevent="openMenu">
                        <Icon symbol="kebab-vertical" />
                    </button>
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
            <div class="filters">
                <template v-if="framework.suites.length">
                    <Ledger :framework="framework" />
                </template>
                <template v-else-if="queued">
                    Queued...
                </template>
                <template v-else-if="refreshing">
                    Refreshing...
                </template>
                <template v-else>
                    No tests loaded. <a href="#" @click.prevent="refresh">Refresh</a>.
                </template>
            </div>
            <div v-if="framework.expandFilters" class="filters">
                <!-- <div class="search" v-if="framework.suites.length > 1">
                    <input type="search" class="form-control input-block input-sm" placeholder="Filter suites">
                </div> -->
            </div>
        </div>
        <Suite
            v-for="suite in framework.suites"
            :suite="suite"
            :running="running"
            :key="suite.getId()"
            @activate="onChildActivation"
        />
    </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import Indicator from '@/components/Indicator'
import Suite from '@/components/Suite'
import Ledger from '@/components/Ledger'
import HasFrameworkMenu from '@/components/mixins/HasFrameworkMenu'

export default {
    name: 'Framework',
    components: {
        Indicator,
        Ledger,
        Suite
    },
    mixins: [
        HasFrameworkMenu
    ],
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
        }
    },
    created () {
        ipcRenderer.on('menu-event', this.onAppMenuEvent)
    },
    mounted () {
        this.$emit('mounted')
    },
    beforeDestroy () {
        ipcRenderer.removeListener('menu-event', this.onAppMenuEvent)
    },
    methods: {
        refresh () {
            this.framework.refresh()
        },
        start () {
            this.framework.start()
        },
        async stop () {
            await this.framework.stop()
        },
        onChildActivation (context) {
            this.$emit('activate', context)
        },
        onAppMenuEvent (event, { name, properties }) {
            if (!this.framework) {
                return
            }

            switch (name) {
                case 'run-framework':
                    this.framework.start()
                    break
                case 'refresh-framework':
                    this.framework.refresh()
                    break
                case 'stop-framework':
                    this.framework.stop()
                    break
                case 'framework-settings':
                    this.manage()
                    break
                case 'remove-framework':
                    this.remove()
                    break
            }
        }
    }
}
</script>
