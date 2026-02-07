<script>
import { mapState } from 'pinia'
import Indicator from '@/components/Indicator.vue'
import SidebarFramework from '@/components/SidebarFramework.vue'
import stores from '@/stores'

const { useContextStore } = stores

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
        }
    },
    computed: {
        ...mapState(useContextStore, { activeFramework: 'framework' }),
    },
    mounted() {
        Lode.ipc
            .on(`${this.model.id}:status:sidebar`, this.statusListener)
            .on(`${this.model.id}:frameworks`, this.updateFrameworks)

        if (this.show) {
            this.getFrameworks()
        }
    },
    beforeUnmount() {
        Lode.ipc
            .removeAllListeners(`${this.model.id}:status:sidebar`)
            .removeAllListeners(`${this.model.id}:frameworks`)
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
        <div class="header" @contextmenu="onContextMenu" @click="toggle">
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
