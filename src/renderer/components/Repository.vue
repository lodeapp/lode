<template>
    <div
        class="repository parent"
        :class="[
            `status--${repository.status}`,
            `is-${expandStatus}`,
            repository.frameworks.length ? '' : 'is-empty'
        ]"
    >
        <div class="header">
            <div class="title">
                <Indicator :status="repository.status" />
                <h2 class="heading">
                    <span class="toggle" @click="toggle">
                        <Icon :symbol="show ? 'chevron-down' : 'chevron-right'" />
                    </span>
                    <span class="repository-name">
                        <Icon symbol="repo" />{{ repository.name }}
                    </span>
                </h2>
                <div class="actions">
                    <button type="button" class="btn-link more-actions" @click="onMoreClick">
                        <Icon symbol="kebab-vertical" />
                    </button>
                    <template v-if="repository.frameworks.length">
                        <button
                            class="btn btn-sm btn-primary"
                            :disabled="running || refreshing"
                            @click="run"
                        >
                            Run
                            <span v-if="repository.frameworks.length > 1" class="Counter">{{ repository.frameworks.length }}</span>
                        </button>
                        <button
                            class="btn btn-sm btn-danger"
                            :disabled="!running && !refreshing"
                            @click="stop"
                        >
                            Stop
                        </button>
                    </template>
                    <template v-else>
                        <button
                            class="btn btn-sm btn-primary"
                            @click="scan"
                        >
                            Scan
                        </button>
                    </template>
                </div>
            </div>
            <div class="progress" v-show="show">
                <template v-if="!repository.frameworks.length">
                    No test frameworks loaded. <a href="#" @click.prevent="scan">Scan repository</a>.
                </template>
            </div>
        </div>
        <Framework
            v-show="show"
            v-for="framework in repository.frameworks"
            :key="framework.id"
            :framework="framework"
            @change="storeState"
        />
    </div>
</template>

<script>
import { remote } from 'electron'
import { mapActions } from 'vuex'
import Framework from '@/components/Framework'
import Indicator from '@/components/Indicator'

export default {
    name: 'Repository',
    components: {
        Framework,
        Indicator
    },
    props: {
        repository: {
            type: Object,
            required: true
        }
    },
    data () {
        const { Menu, MenuItem } = remote

        const menu = new Menu()
        menu.append(new MenuItem({
            label: 'Manage frameworks…',
            click: () => {
                this.manage()
            }
        }))
        menu.append(new MenuItem({ type: 'separator' }))
        menu.append(new MenuItem({
            label: 'Remove…',
            click: () => {
                this.remove()
            }
        }))
        menu.on('menu-will-close', () => {
            this.$el.querySelector('.more-actions').blur()
        })

        return {
            show: true,
            menu
        }
    },
    computed: {
        running () {
            return this.repository.status === 'running'
        },
        refreshing () {
            return this.repository.status === 'refreshing'
        },
        expandStatus () {
            return this.show ? 'expanded' : 'collapsed'
        }
    },
    methods: {
        toggle () {
            this.show = !this.show
        },
        scan () {
            this.repository.scan()
                .then(pending => {
                    this.$modal.open('ManageFrameworks', {
                        repository: this.repository,
                        scanned: true,
                        pending
                    })
                })
        },
        onMoreClick (event) {
            event.preventDefault()
            const { x, y, height } = this.$el.querySelector('.more-actions').getBoundingClientRect()
            this.menu.popup({
                window: remote.getCurrentWindow(),
                x: Math.ceil(x),
                y: Math.ceil(y + height + 6)
            })
        },
        manage () {
            this.$modal.open('ManageFrameworks', {
                repository: this.repository,
                scanned: false
            })
        },
        remove () {
            this.$modal.confirm('RemoveRepository', { repository: this.repository })
                .then(() => {
                    this.$emit('remove', this.repository)
                })
                .catch(() => {})
        },
        run () {
            this.repository.frameworks.forEach(framework => {
                this.$queue.add(framework.queueStart())
            })
        },
        stop () {
            this.repository.frameworks.forEach(framework => {
                framework.stop()
            })
        },
        storeState (framework) {
            this.frameworkChange({ repositoryId: this.repository.id, framework })
        },
        ...mapActions({
            frameworkChange: 'config/frameworkChange'
        })
    }
}
</script>
