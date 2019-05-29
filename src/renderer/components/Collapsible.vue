<template>
    <div class="collapsible" :class="[content ? 'has-content' : '', `is-${expanded ? 'expanded' : 'collapsed'}`]">
        <div class="header" @dblclick.prevent="toggle">
            <button v-if="copy" class="btn-link" @click.stop.prevent="clipboard">
                <Icon :symbol="'clippy'" />
            </button>
            <button v-if="content" class="btn btn-sm" @click.stop.prevent="toggle">
                <Icon :symbol="expanded ? 'dash' : 'plus'" />
            </button>
            <slot name="header"></slot>
        </div>
        <div class="content" v-if="expanded">
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
        },
        copy: {
            type: String,
            default: ''
        }
    },
    data () {
        return {
            content: this.$slots.default,
            expanded: this.show && this.$slots.default
        }
    },
    methods: {
        toggle () {
            if (!this.content) {
                return
            }
            this.expanded = !this.expanded
        },
        clipboard () {
            this.$root.copyToClipboard(this.copy)
        }
    }
}
</script>
