<script>
import octicons from '@primer/octicons'

export default {
    name: 'Icon',
    props: {
        symbol: {
            type: String,
            required: true
        }
    },
    render (createElement) {
        return createElement('i', {
            domProps: {
                innerHTML: octicons[this.symbol].toSVG()
            }
        })
    }
}
</script>
