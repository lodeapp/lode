<template>
    <div
        class="header"
        @mousedown="activate"
        @contextmenu="openMenu"
    >
        <div class="title">
            <Indicator :status="framework.status" />
            <h4 class="heading">
                <span class="name" :title="framework.name">
                    {{ framework.name }}
                </span>
            </h4>
        </div>
    </div>
</template>

<script>
import Indicator from '@/components/Indicator'
import HasFrameworkMenu from '@/components/mixins/HasFrameworkMenu'

export default {
    name: 'SidebarFramework',
    components: {
        Indicator
    },
    mixins: [
        HasFrameworkMenu
    ],
    props: {
        framework: {
            type: Object,
            required: true
        }
    },
    methods: {
        activate () {
            this.framework.setActive(true)
            this.$emit('activate', this.framework.getId())
        }
    }
}
</script>
