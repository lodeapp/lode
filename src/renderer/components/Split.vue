<template>
    <div class="split">
        <slot></slot>
    </div>
</template>

<script>
import Split from 'split.js'
import { state } from '@lib/state'

export default {
    name: 'Split',
    mounted () {
        Split([...this.$el.querySelectorAll('.pane')], {
            sizes: state.get('paneSizes'),
            gutterAlign: 'center',
            minSize: [200, 350, 350],
            snapOffset: 0,
            gutterSize: 11,
            onDragEnd (sizes) {
                state.set('paneSizes', sizes)
            }
        })
    }
}
</script>
