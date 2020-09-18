<template>
    <div class="split">
        <slot></slot>
    </div>
</template>

<script>
import Split from 'split.js'

export default {
    name: 'Split',
    mounted () {
        Split([...this.$el.querySelectorAll('.pane')], {
            sizes: this.$root.setting('paneSizes'),
            gutterAlign: 'center',
            minSize: [200, 350, 350],
            snapOffset: 0,
            gutterSize: 11,
            onDragEnd (sizes) {
                this.$root.updateSetting('paneSizes', sizes)
            }
        })
    }
}
</script>
