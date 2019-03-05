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
                    <span class="toggle" @mousedown="toggle">
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
                    <template v-if="!repository.frameworks.length">
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
        <template v-if="!repository.frameworks.length">
            <div class="empty-cta" v-show="show">
                No test frameworks loaded. <a href="#" @click.prevent="scan">Scan repository</a>.
            </div>
        </template>
        <template v-else>
            <Framework
                v-show="show"
                v-for="framework in repository.frameworks"
                :key="framework.getId()"
                :framework="framework"
                @remove="removeFramework"
                @manage="manageFramework"
                @activate="onChildActivation"
            />
        </template>
    </div>
</template>

<script>
import { Menu } from '@main/menu'
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
        return {
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
        show () {
            return this.repository.expanded
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
            this.$root.onModelRemove(framework.getId())
            this.repository.removeFramework(framework.getId())
            this.repository.save()
        },
        onChildActivation (context) {
            context.unshift(this.repository)
            this.$store.commit('context/ADD', this.repository.getId())
            this.$emit('activate', context)
        }
    }
}
</script>
