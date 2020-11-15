<template>
    <div
        class="sidebar-item has-status"
        :class="[
            `status--${status}`,
            menuActive ? 'is-menu-active' : '',
            frameworks.length ? '' : 'is-empty'
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

<script>
import { mapGetters } from 'vuex'
import Indicator from '@/components/Indicator'
import SidebarFramework from '@/components/SidebarFramework'

export default {
    name: 'SidebarRepository',
    components: {
        Indicator,
        SidebarFramework
    },
    props: {
        model: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            frameworks: [],
            status: this.model.status || 'idle',
            menuActive: false
        }
    },
    computed: {
        show () {
            return this.model.expanded
        },
        ...mapGetters({
            activeFramework: 'context/framework'
        })
    },
    mounted () {
        Lode.ipc
            .on(`${this.model.id}:status:sidebar`, this.statusListener)
            .on(`${this.model.id}:frameworks`, this.updateFrameworks)

        if (this.model.expanded) {
            this.getFrameworks()
        }
    },
    beforeDestroy () {
        Lode.ipc
            .removeAllListeners(`${this.model.id}:status:sidebar`)
            .removeAllListeners(`${this.model.id}:frameworks`)
    },
    methods: {
        async getFrameworks () {
            this.frameworks = JSON.parse(await Lode.ipc.invoke('repository-frameworks', this.model.id))
        },
        statusListener (event, payload) {
            this.$payload(payload, (to, from) => {
                this.status = to
                this.$emit('status', to, from, this.model)
            })
        },
        updateFrameworks (event, payload) {
            this.$payload(payload, frameworks => {
                this.frameworks = frameworks
            })
        },
        toggle () {
            this.model.expanded = !this.model.expanded
            Lode.ipc.send('repository-toggle', this.model.id, this.model.expanded)
            if (this.model.expanded) {
                this.getFrameworks()
                return
            }
            this.frameworks = []
        },
        onContextMenu () {
            this.menuActive = true
            Lode.ipc.invoke('repository-context-menu', this.model.id).finally(() => {
                this.menuActive = false
            })
        },
        onFrameworkActivation (frameworkId) {
            this.$emit('framework-activate', frameworkId, this.model)
        },
        onFrameworkManage (framework) {
            this.$emit('framework-manage', framework)
        },
        onFrameworkRemove (frameworkId) {
            this.$emit('framework-remove', frameworkId)
        }
    }
}
</script>
