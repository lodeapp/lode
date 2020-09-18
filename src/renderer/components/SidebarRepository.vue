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
            return this.model.expanded
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
        updateFrameworks (event, payload) {
            this.$payload(payload, frameworks => {
                console.log(
                    'updating frameworks on repository',
                    frameworks,
                    this.activeFramework,
                    this.frameworks
                )
                if (!this.activeFramework && !this.frameworks.length && frameworks.length > 0) {
                    // If there is no active framework currently, and frameworks have
                    // been added, activate the first one automatically.
                    this.onFrameworkActivation(frameworks[0])
                } else if (this.activeFramework && !frameworks.map(framework => framework.id).includes(this.activeFramework)) {
                    // Alternatively, if the current active framework no longer exists
                    // in this repository, also select the first one automatically,
                    // or remove active framework altogether.
                    console.log('activeFramework removed, activating', frameworks.length ? frameworks[0] : null)
                    this.onFrameworkActivation(frameworks.length ? frameworks[0] : null)
                }
                this.frameworks = frameworks
                this.$emit('frameworks', frameworks)
            })
        },
        refresh () {
            ipcRenderer.send('repository-refresh', this.model.id)
        },
        start () {
            ipcRenderer.send('repository-start', this.model.id)
        },
        stop () {
            ipcRenderer.send('repository-stop', this.model.id)
        },
        toggle () {
            this.model.expanded = !this.model.expanded
            ipcRenderer.send('repository-toggle', this.model.id, this.model.expanded)
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
