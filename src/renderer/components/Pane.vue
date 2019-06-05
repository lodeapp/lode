<template>
    <div class="pane">
        <slot></slot>
    </div>
</template>

<script>
import OverlayScrollbars from 'overlayscrollbars'

export default {
    name: 'Pane',
    data () {
        return {
            scrollbars: null
        }
    },
    mounted () {
        if (this.$el.classList.contains('sidebar')) {
            this.overlayScrollbars()
        }
    },
    updated () {
        if (this.scrollbars) {
            this.scrollbars.destroy()
            this.overlayScrollbars()
        }
    },
    beforeDestroy () {
        if (this.scrollbars) {
            this.scrollbars.destroy()
        }
    },
    methods: {
        overlayScrollbars () {
            this.scrollbars = OverlayScrollbars(this.$el.querySelector('section'), {
                sizeAutoCapable: false,
                scrollbars: {
                    autoHide: 'leave',
                    autoHideDelay: 5,
                    clickScrolling: true
                }
            })
        }
    }
}
</script>
