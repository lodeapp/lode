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
                    <Icon symbol="repo" />
                    <span class="name" :title="repository.name">
                        {{ repository.name }}
                    </span>
                </h2>
                <div class="actions">
                    <button type="button" class="btn-link more-actions" @click.prevent="onMoreClick">
                        <Icon symbol="kebab-vertical" />
                    </button>
                    <template v-if="repository.frameworks.length">
                        <button class="btn btn-sm" @click="refresh" :disabled="running || refreshing">
                            <Icon symbol="sync" />
                        </button>
                        <button
                            class="btn btn-sm btn-primary"
                            :disabled="running || refreshing"
                            @click="start"
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
        </div>
        <template v-if="!repository.initialFrameworkCount">
            <div class="empty-cta" v-show="show">
                No test frameworks loaded. <a href="#" @click.prevent="scan">Scan repository</a>.
            </div>
        </template>
        <template v-else>
            <Framework
                v-show="show"
                v-for="framework in repository.frameworks"
                :key="framework.id"
                :model="framework"
                @remove="removeFramework"
                @change="storeFrameworkState"
                @manage="manageFramework"
                @activate="onChildActivation"
                @deactivate="onChildDeactivation"
            />
        </template>
    </div>
</template>

<script>
import { Menu } from '@main/menu'
import Framework from '@/components/Framework'
import Indicator from '@/components/Indicator'
import Breadcrumb from '@/components/mixins/breadcrumb'

export default {
    name: 'Repository',
    components: {
        Framework,
        Indicator
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
            loading: true,
            menu: new Menu()
                .add({
                    label: 'Manage frameworks',
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
        repository () {
            return this.model
        },
        show () {
            return !this.repository.collapsed
        },
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
    created () {
        this.repository
            .on('ready', () => {
                this.loading = false
            })
            .on('change', repository => {
                this.$emit('change', repository)
            })
    },
    methods: {
        toggle () {
            this.repository.toggle()
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
            this.menu
                .attachTo(this.$el.querySelector('.more-actions'))
                .open()
        },
        manage () {
            this.$modal.open('ManageFrameworks', {
                repository: this.repository,
                scanned: false
            })
        },
        manageFramework (framework) {
            this.$modal.open('ManageFrameworks', {
                repository: this.repository,
                scanned: false,
                framework
            })
        },
        remove () {
            this.$modal.confirm('RemoveRepository', { repository: this.repository })
                .then(() => {
                    this.$emit('remove', this.repository)
                })
                .catch(() => {})
        },
        start () {
            this.$root.latest(
                this.$string.set(':0 repository run', this.repository.name),
                () => this.repository.start()
            )
        },
        refresh () {
            this.repository.refresh()
        },
        stop () {
            this.repository.stop()
        },
        removeFramework (framework) {
            this.$root.onModelRemove(framework.id)
            this.repository.removeFramework(framework.id)
            this.repository.save()
        },
        storeFrameworkState (framework) {
            framework.save()
        }
    }
}
</script>
