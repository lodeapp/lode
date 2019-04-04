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
                    <button type="button" class="btn-link more-actions" @click.prevent="onMoreClick">
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
import { Menu } from '@main/menu'
import Indicator from '@/components/Indicator'
import Suite from '@/components/Suite'
import Ledger from '@/components/Ledger'

export default {
    name: 'Framework',
    components: {
        Indicator,
        Ledger,
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
            menu: new Menu()
                .add({
                    label: 'Framework settings…',
                    click: () => {
                        this.manage()
                    }
                })
                .separator()
                .add({
                    label: 'Remove',
                    click: () => {
                        this.remove()
                    }
                })
                .after(() => {
                    this.$el.querySelector('.more-actions').blur()
                })
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
        // this.framework.on('error', (error, process) => {
        //     this.$alert.show({
        //         message: this.$string.set('The process for **:0** terminated unexpectedly.', this.framework.name),
        //         help: this.framework.troubleshoot(error),
        //         type: 'error',
        //         error
        //     })
        // })

        // this.framework.on('suiteRemoved', suite => {
        //     this.$root.onModelRemove(suite.getId())
        // })
    },
    mounted () {
        this.$emit('mounted')
    },
    methods: {
        onMoreClick (event) {
            this.menu
                .attachTo(this.$el.querySelector('.more-actions'))
                .open()
        },
        refresh () {
            this.framework.refresh()
        },
        start () {
            this.framework.start()
        },
        async stop () {
            await this.framework.stop()
        },
        manage () {
            this.$emit('manage', this.framework)
        },
        remove () {
            this.$modal.confirm('RemoveFramework', { framework: this.framework })
                .then(() => {
                    this.$emit('remove', this.framework)
                })
                .catch(() => {})
        },
        onChildActivation (context) {
            this.$emit('activate', context)
        }
    }
}
</script>
