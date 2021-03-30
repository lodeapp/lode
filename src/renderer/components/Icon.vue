<script>
import { h } from 'vue'
import octicons from '@primer/octicons'

export default {
    name: 'Icon',
    props: {
        symbol: {
            type: String,
            required: true
        }
    },
    render () {
        return h('i', {
            innerHTML: octicons[this.symbol].toSVG()
        })
    }
}
</script>
