<template>
    <div
        class="sidebar-item sidebar-item--framework has-status"
        :class="[
            `status--${status}`,
            isActive ? 'is-active' : ''
        ]"
    >
        <div
            class="header"
            @mousedown="activate"
            @contextmenu="openMenu"
        >
            <div class="title">
                <Indicator :status="status" />
                <h4 class="heading">
                    <span class="name" :title="framework.name">
                        <!-- @TODO: redo display name; also line above -->
                        <!-- {{ framework.getDisplayName() }} -->
                        {{ framework.name }}
                    </span>
                </h4>
            </div>
        </div>
    </div>
</template>

<script>
import Indicator from '@/components/Indicator'
import HasFrameworkMenu from '@/components/mixins/HasFrameworkMenu'
import HasStatus from '@/components/mixins/HasStatus'

export default {
    name: 'SidebarFramework',
    components: {
        Indicator
    },
    mixins: [
        HasFrameworkMenu,
        HasStatus
    ],
    props: {
        framework: {
            type: Object,
            required: true
        }
    },
    computed: {
        model () {
            return this.framework
        },
        isActive () {
            return this.$store.getters['context/framework'] === this.framework.id
        }
    },
    methods: {
        activate () {
            this.$emit('activate', this.framework.id)
        }
    }
}
</script>
