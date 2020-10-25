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
            @contextmenu="onContextMenu"
        >
            <div class="title">
                <Indicator :status="status" />
                <h4 class="heading">
                    <span class="name" :title="model.name">
                        {{ model.name }}
                    </span>
                </h4>
            </div>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex'
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
        model: {
            type: Object,
            required: true
        }
    },
    computed: {
        isActive () {
            return this.active === this.model.id
        },
        ...mapGetters({
            active: 'context/active'
        })
    },
    methods: {
        activate () {
            if (!this.isActive) {
                this.$emit('activate', this.model.id)
            }
        }
    }
}
</script>
