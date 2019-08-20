<template>
    <div
        class="sidebar-item has-status"
        :class="[
            `status--${repository.status}`,
            menuActive ? 'is-menu-active' : '',
            repository.frameworks.length ? '' : 'is-empty'
        ]"
    >
        <div class="header" @contextmenu="openMenu" @click="toggle">
            <div class="title">
                <Indicator :status="repository.status" />
                <h4 class="heading">
                    <Icon class="toggle" :symbol="show ? 'chevron-down' : 'chevron-right'" />
                    <span class="name" :title="repository.name">
                        {{ repository.name }}
                    </span>
                </h4>
            </div>
        </div>
        <div v-if="show">
            <slot></slot>
        </div>
    </div>
</template>

<script>
import Indicator from '@/components/Indicator'
import HasRepositoryMenu from '@/components/mixins/HasRepositoryMenu'

export default {
    name: 'SidebarRepository',
    components: {
        Indicator
    },
    mixins: [
        HasRepositoryMenu
    ],
    props: {
        repository: {
            type: Object,
            required: true
        }
    },
    computed: {
        show () {
            return this.repository.isExpanded()
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
        }
    }
}
</script>
