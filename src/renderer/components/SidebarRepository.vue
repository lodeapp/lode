<script>
import { mapState } from 'pinia'
import Indicator from '@/components/Indicator.vue'
import SidebarFramework from '@/components/SidebarFramework.vue'
import { useContextStore, useSettingsStore, useSnapshotStore } from '@/stores'

export default {
    name: 'SidebarRepository',
    components: {
        Indicator,
        SidebarFramework,
    },
    props: {
        model: {
            type: Object,
            required: true,
        },
        branch: {
            type: String,
            default: null,
        },
    },
    emits: [
        'status',
        'frameworkActivate',
        'frameworkManage',
        'frameworkRemove',
    ],
    data() {
        return {
            frameworks: [],
            status: this.model.status || 'idle',
            show: this.model.expanded,
            menuActive: false,
            liveBranch: null,
        }
    },
    computed: {
        ...mapState(useContextStore, { activeFramework: 'framework' }),
        ...mapState(useSnapshotStore, { isReadOnly: 'isReadOnly' }),
        showBranches() {
            return useSettingsStore().value('showBranches') !== false
        },
        displayBranch() {
            if (!this.showBranches) {
                return null
            }
            return this.branch || this.liveBranch
        },
    },
    mounted() {
        Lode.ipc
            .on(`${this.model.id}:status:sidebar`, this.statusListener)
            .on(`${this.model.id}:frameworks`, this.updateFrameworks)
            .on('focus', this.onFocus)

        if (this.show) {
            this.getFrameworks()
        }

        this.fetchBranch()
    },
    beforeUnmount() {
        Lode.ipc
            .removeAllListeners(`${this.model.id}:status:sidebar`)
            .removeAllListeners(`${this.model.id}:frameworks`)
            .removeListener('focus', this.onFocus)
    },
    methods: {
        async getFrameworks() {
            this.frameworks = await Lode.ipc.invoke('repository-frameworks', this.model.id)
        },
        statusListener(event, to, from) {
            this.status = to
            this.$emit('status', to, from, this.model)
        },
        updateFrameworks(event, frameworks) {
            this.frameworks = frameworks
        },
        toggle() {
            this.show = !this.show
            Lode.ipc.send('repository-toggle', this.model.id, this.show)
            if (this.show) {
                this.getFrameworks()
                return
            }
            this.frameworks = []
        },
        onContextMenu() {
            this.menuActive = true
            Lode.ipc.invoke('repository-context-menu', this.model.id).finally(() => {
                this.menuActive = false
            })
        },
        onFrameworkActivation(frameworkId) {
            this.$emit('frameworkActivate', frameworkId, this.model)
        },
        onFrameworkManage(framework) {
            this.$emit('frameworkManage', framework)
        },
        onFrameworkRemove(frameworkId) {
            this.$emit('frameworkRemove', frameworkId)
        },
        async fetchBranch() {
            if (this.isReadOnly || !this.showBranches) {
                return
            }
            try {
                this.liveBranch = await Lode.ipc.invoke('repository-branch', this.model.id)
            }
            catch (error) {
                log.info('Failed to fetch branch:', error)
                this.liveBranch = null
            }
        },
        onFocus() {
            this.fetchBranch()
        },
    },
}
</script>

<template>
    <div
        class="sidebar-item has-status"
        :class="[
            `status--${status}`,
            show ? 'is-expanded' : '',
            menuActive ? 'is-menu-active' : '',
            frameworks.length ? '' : 'is-empty',
        ]"
    >
        <div class="header" @contextmenu="!isReadOnly && onContextMenu()" @click="toggle">
            <div class="title">
                <Indicator :status="status" />
                <h4 class="heading">
                    <Icon class="toggle" :symbol="show ? 'chevron-down' : 'chevron-right'" />
                    <span class="name" :title="model.name">
                        {{ model.name }}
                    </span>
                </h4>
            </div>
        </div>
        <div v-if="displayBranch && show" class="branch">
            <Icon symbol="git-branch" />
            <span>{{ displayBranch }}</span>
        </div>
        <div v-if="show">
            <SidebarFramework
                v-for="framework in frameworks"
                :key="framework.id"
                :model="framework"
                @activate="onFrameworkActivation"
                @manage="onFrameworkManage"
                @remove="onFrameworkRemove"
            />
        </div>
    </div>
</template>
