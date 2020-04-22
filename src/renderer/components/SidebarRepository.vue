<template>
    <div
        class="sidebar-item has-status"
        :class="[
            `status--${status}`,
            menuActive ? 'is-menu-active' : '',
            repository.frameworks.length ? '' : 'is-empty'
        ]"
    >
        <div class="header" @contextmenu="openMenu" @click="toggle">
            <div class="title">
                <Indicator :status="status" />
                <h4 class="heading">
                    <Icon class="toggle" :symbol="show ? 'chevron-down' : 'chevron-right'" />
                    <span class="name" :title="repository.name">
                        {{ repository.name }}
                    </span>
                </h4>
            </div>
        </div>
        <div v-if="show">
            <SidebarFramework
                v-for="framework in repository.frameworks"
                :key="framework.id"
                :framework="framework"
                @activate="onFrameworkActivation"
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
        repository: {
            type: Object,
            required: true
        }
    },
    computed: {
        model () {
            return this.repository
        },
        show () {
            // @TODO: redo is expanded
            // return this.repository.isExpanded()
            return true
        }
    },
    methods: {
        start () {
            this.repository.start()
        },
        refresh () {
            this.repository.refresh()
        },
        stop () {
            this.repository.stop()
        },
        toggle () {
            this.repository.toggle()
        },
        onFrameworkActivation (frameworkId) {
            this.$emit('framework-activate', frameworkId, this.repository)
        }
    }
}
</script>
