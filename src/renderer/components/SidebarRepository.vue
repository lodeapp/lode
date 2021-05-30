<template>
    <div
        class="sidebar-item has-status"
        :class="[
            `status--${status}`,
            show ? 'is-expanded' : '',
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
    emits: [
        'status',
        'framework-activate',
        'framework-manage',
        'framework-remove'
    ],
    data () {
        return {
            frameworks: [],
            status: this.model.status || 'idle',
            show: this.model.expanded,
            menuActive: false
        }
    },
    computed: {
        ...mapGetters({
            activeFramework: 'context/framework'
        })
    },
    mounted () {
        Lode.ipc
            .on(`${this.model.id}:status:sidebar`, this.statusListener)
            .on(`${this.model.id}:frameworks`, this.updateFrameworks)

        if (this.show) {
            this.getFrameworks()
        }
    },
    beforeUnmount () {
        Lode.ipc
            .removeAllListeners(`${this.model.id}:status:sidebar`)
            .removeAllListeners(`${this.model.id}:frameworks`)
    },
    methods: {
        async getFrameworks () {
            this.frameworks = await Lode.ipc.invoke('repository-frameworks', this.model.id)
        },
        statusListener (event, to, from) {
            this.status = to
            this.$emit('status', to, from, this.model)
        },
        updateFrameworks (event, frameworks) {
            this.frameworks = frameworks
        },
        toggle () {
            this.show = !this.show
            Lode.ipc.send('repository-toggle', this.model.id, this.show)
            if (this.show) {
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
