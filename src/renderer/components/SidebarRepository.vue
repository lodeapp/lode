<template>
    <div
        class="sidebar-item has-status"
        :class="[
            `status--${status}`,
            menuActive ? 'is-menu-active' : '',
            frameworks.length ? '' : 'is-empty'
        ]"
    >
        <div class="header" @contextmenu="openMenu" @click="toggle">
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
            <!-- @TODO: redo listeners -->
            <!--
                @manage="manageFramework"
                @remove="removeFramework"
             -->
        </div>
    </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import { mapGetters } from 'vuex'
import Indicator from '@/components/Indicator'
import SidebarFramework from '@/components/SidebarFramework'
import HasRepositoryMenu from '@/components/mixins/HasRepositoryMenu'
import HasStatus from '@/components/mixins/HasStatus'

export default {
    name: 'SidebarRepository',
    components: {
        Indicator,
        SidebarFramework
    },
    mixins: [
        HasRepositoryMenu,
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
            frameworks: this.model.frameworks || []
        }
    },
    computed: {
        show () {
            // @TODO: redo is expanded
            // return this.model.isExpanded()
            return true
        },
        ...mapGetters({
            activeFramework: 'context/framework'
        })
    },
    created () {
        ipcRenderer.on(`${this.model.id}:frameworks`, this.updateFrameworks)
    },
    destroyed () {
        ipcRenderer.removeListener(`${this.model.id}:frameworks`, this.updateFrameworks)
    },
    methods: {
        updateFrameworks (event, frameworks) {
            frameworks = JSON.parse(frameworks)
            // If there is no active framework currently, and frameworks have
            // been added, activate the first one automatically.
            console.log(!this.activeFramework && !this.frameworks.length && frameworks.length > 0)
            if (!this.activeFramework && !this.frameworks.length && frameworks.length > 0) {
                this.frameworks = frameworks
                this.onFrameworkActivation(frameworks[0])
                return
            }
            this.frameworks = frameworks
        },
        start () {
            this.model.start()
        },
        refresh () {
            this.model.refresh()
        },
        stop () {
            this.model.stop()
        },
        toggle () {
            this.model.toggle()
        },
        onFrameworkActivation (framework) {
            this.$emit('framework-activate', framework, this.model)
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
