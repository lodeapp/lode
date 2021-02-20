<template>
    <section class="scrollable">
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
    },
    beforeDestroy () {
        this.scrollbars.destroy()
    },
    methods: {
        addShadow () {
            // Manipulate DOM directly for shadow display, otherwise we risk
            // re-rendering the Vue component, which will re-instantiate the
            // scrollbar plugin and cause jitter when scrolling to and from
            // position zero.
            this.removeShadow()
            const shadow = document.createElement('div')
            shadow.classList.add('shadow')
            this.$el.prepend(shadow)
        },
        removeShadow () {
            if (this.$el.querySelector('.shadow')) {
                this.$el.querySelector('.shadow').remove()
            }
        },
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
                        if (event.target.scrollTop > 0) {
                            if (!this.$el.querySelector('.shadow')) {
                                this.addShadow()
                            }
                            return
                        }
                        this.removeShadow()
                    }
                }
            })
            this.scrollbars.scroll(this.position)
            if (this.position > 0) {
                this.addShadow()
            }
        }
    }
}
</script>
