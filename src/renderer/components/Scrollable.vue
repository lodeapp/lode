<template>
    <section>
        <slot></slot>
    </section>
</template>

<script>
import _get from 'lodash/get'
import OverlayScrollbars from 'overlayscrollbars'

export default {
    name: 'Scrollable',
    data () {
        return {
            scrollbars: null,
            position: 0
        }
    },
    mounted () {
        this.overlayScrollbars()
    },
    updated () {
        this.position = _get(this.scrollbars.scroll(), 'position.y')
        this.scrollbars.destroy()
        this.overlayScrollbars()
    },
    beforeDestroy () {
        this.scrollbars.destroy()
    },
    methods: {
        overlayScrollbars () {
            this.scrollbars = OverlayScrollbars(this.$el, {
                sizeAutoCapable: false,
                scrollbars: {
                    autoHide: 'leave',
                    autoHideDelay: 5,
                    clickScrolling: true
                }
            })
            this.scrollbars.scroll(this.position)
        }
    }
}
</script>
