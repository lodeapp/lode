<script>
import octicons from '@primer/octicons'
import { h } from 'vue'

export default {
    name: 'Icon',
    props: {
        symbol: {
            type: String,
            required: true,
        },
    },
    render() {
        return h('i', {
            innerHTML: octicons[this.symbol].toSVG(),
        })
    },
}
</script>
