<template>
    <div
        class="sidebar-item has-status"
        :class="[
            `status--${repository.status}`,
            repository.frameworks.length ? '' : 'is-empty'
        ]"
    >
        <div class="header" @click="onMoreClick">
            <div class="title">
                <Indicator :status="repository.status" />
                <h4 class="heading">
                    <Icon class="toggle" symbol="chevron-down" />
                    <span class="name" :title="repository.name">
                        {{ repository.name }}
                    </span>
                </h4>
            </div>
        </div>
        <div
            v-for="framework in repository.frameworks"
            :key="framework.getId()"
            class="sidebar-item sidebar-item--framework has-status"
            :class="[
                `status--${framework.status}`,
                selectedFramework === framework.getId() ? 'is-active' : ''
            ]"
        >
            <div class="header" @mousedown="selectFramework(framework.getId())">
                <div class="title">
                    <Indicator :status="framework.status" />
                    <h4 class="heading">
                        <span class="name" :title="framework.name">
                            {{ framework.name }}
                        </span>
                    </h4>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { Menu } from '@main/menu'
import Indicator from '@/components/Indicator'

export default {
    name: 'Repository',
    components: {
        Indicator
    },
    props: {
        initial: {
            type: String,
            required: true
        },
        repository: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            selectedFramework: this.initial,
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
        running () {
            return this.repository.status === 'running'
        },
        refreshing () {
            return this.repository.status === 'refreshing'
        }
    },
    methods: {
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
                // .attachTo(this.$el.querySelector('.more-actions'))
                .open()
        },
        selectFramework (frameworkId) {
            // In order for the selection to be perceived instantly,
            // we'll store the newly selected framework locally. After
            // emitting the activation to parent, the same will become
            // framework will be persisted via the context.
            this.selectedFramework = frameworkId
            setTimeout(() => {
                this.$emit('activate', frameworkId)
            })
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
        removeFramework (framework) {
            this.$root.onModelRemove(framework.getId())
            this.repository.removeFramework(framework.getId())
            this.repository.save()
        }
    }
}
</script>
