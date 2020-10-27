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
import { ipcRenderer } from 'electron'
import { mapGetters } from 'vuex'
import Indicator from '@/components/Indicator'
import SidebarFramework from '@/components/SidebarFramework'
import HasStatus from '@/components/mixins/HasStatus'

export default {
    name: 'SidebarRepository',
    components: {
        Indicator,
        SidebarFramework
    },
    mixins: [
        HasStatus
    ],
    props: {
        model: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            frameworks: [],
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
    created () {
        ipcRenderer.on(`${this.model.id}:frameworks`, this.updateFrameworks)
        if (this.model.expanded) {
            this.getFrameworks()
        }
    },
    beforeDestroy () {
        ipcRenderer.removeListener(`${this.model.id}:frameworks`, this.updateFrameworks)
    },
    methods: {
        async getFrameworks () {
            this.frameworks = JSON.parse(await ipcRenderer.invoke('repository-frameworks', this.model.id))
        },
        updateFrameworks (event, payload) {
            this.$payload(payload, frameworks => {
                this.frameworks = frameworks
            })
        },
        toggle () {
            this.model.expanded = !this.model.expanded
            ipcRenderer.send('repository-toggle', this.model.id, this.model.expanded)
            if (this.model.expanded) {
                this.getFrameworks()
                return
            }
            this.frameworks = []
        },
        onContextMenu () {
            this.menuActive = true
            ipcRenderer.invoke('repository-context-menu', this.model.id).finally(() => {
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
