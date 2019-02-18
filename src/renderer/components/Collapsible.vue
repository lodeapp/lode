<template>
    <div class="collapsible" :class="[content ? 'has-content' : '', `is-${expanded ? 'expanded' : 'collapsed'}`]">
        <div class="header">
            <button v-if="content" class="btn btn-sm" @click.prevent="toggle">
                <Icon :symbol="expanded ? 'dash' : 'plus'" />
            </button>
            <slot name="header"></slot>
        </div>
        <div class="content" v-show="expanded">
            <slot></slot>
        </div>
    </div>
</template>

<script>
export default {
    name: 'Collapsibe',
    props: {
        show: {
            type: Boolean,
            default: false
        }
    },
    data () {
        return {
            content: this.$slots.default,
            expanded: this.show
        }
    },
    methods: {
        toggle () {
            this.expanded = !this.expanded
        }
    }
}
</script>
