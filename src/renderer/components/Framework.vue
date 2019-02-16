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
                <Indicator :status="framework.status" />
                <h3 class="heading">
                    <span class="toggle" @click="toggle">
                        <Icon :symbol="show ? 'chevron-down' : 'chevron-right'" />
                    </span>
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
                        @click="toggleFilters"
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
                :model="suite"
                :running="running"
                :key="suite.id"
                @activate="onChildActivation"
                @deactivate="onChildDeactivation"
            />
        </template>
    </div>
</template>

<script>
import { Menu } from '@main/menu'
import Indicator from '@/components/Indicator'
import Suite from '@/components/Suite'
import Ledger from '@/components/Ledger'
import Breadcrumb from '@/components/mixins/breadcrumb'

export default {
    name: 'Framework',
    components: {
        Indicator,
        Suite,
        Ledger
    },
    mixins: [
        Breadcrumb
    ],
    props: {
        model: {
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
        framework () {
            return this.model
        },
        show () {
            return !this.framework.collapsed
        },
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
        this.framework.on('error', (error, process) => {
            this.$alert.show({
                message: this.$string.set('The process for **:0** terminated unexpectedly.', this.framework.name),
                help: this.framework.troubleshoot(error),
                type: 'error',
                error
            })
        })

        this.framework.on('change', framework => {
            this.$emit('change', framework)
        })

        this.framework.on('suiteRemoved', suite => {
            this.$root.onModelRemove(suite.id)
        })
    },
    methods: {
        toggle () {
            this.framework.toggle()
        },
        toggleFilters () {
            this.framework.toggleFilters()
        },
        onMoreClick (event) {
            this.menu
                .attachTo(this.$el.querySelector('.more-actions'))
                .open()
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
        }
    }
}
</script>
