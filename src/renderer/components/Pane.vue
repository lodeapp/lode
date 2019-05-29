<template>
    <div class="pane">
        <slot></slot>
    </div>
</template>

<script>
import OverlayScrollbars from 'overlayscrollbars'

export default {
    name: 'Pane',
    mounted () {
        if (this.$el.classList.contains('sidebar')) {
            OverlayScrollbars(this.$el.querySelector('section'), {
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
