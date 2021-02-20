<template>
    <section class="scrollable" :class="{ scrolling }">
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
            position: 0,
            scrolling: false
        }
    },
    mounted () {
        this.overlayScrollbars()
    },
    updated () {
        this.position = _get(this.scrollbars.scroll(), 'position.y')
        this.scrollbars.destroy()
        this.overlayScrollbars()
        this.scrolling = this.position > 0
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
                },
                callbacks: {
                    onScroll: (event, test) => {
                        this.scrolling = event.target.scrollTop > 0
                    }
                }
            })
            this.scrollbars.scroll(this.position)
        }
    }
}
</script>
