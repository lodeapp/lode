<template>
    <div class="split">
        <slot></slot>
    </div>
</template>

<script>
import Split from 'split.js'
import { Config } from '@main/lib/config'

export default {
    name: 'Split',
    mounted () {
        Split([...this.$el.querySelectorAll('.pane')], {
            sizes: Config.get('paneSizes'),
            gutterAlign: 'center',
            minSize: 350,
            snapOffset: 0,
            onDragEnd (sizes) {
                Config.set('paneSizes', sizes)
            }
        })
    }
}
</script>
