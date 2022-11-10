<template>
    <div class="collapsible" :class="[content ? 'has-content' : '', `is-${expanded ? 'expanded' : 'collapsed'}`]">
        <div class="header" @dblclick.prevent="toggle">
            <button v-if="content" class="btn btn-sm" @click.stop.prevent="toggle">
                <Icon :symbol="expanded ? 'dash' : 'plus'" />
            </button>
            <button v-if="copy" class="btn-link" title="Copy to clipboard" @click.stop.prevent="clipboard">
                <Icon symbol="copy" />
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
            expanded: this.show && !!this.$slots.default
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
            Lode.copyToClipboard(this.copy)
        }
    }
}
</script>
