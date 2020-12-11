<script>
import octicons from 'octicons'

export default {
    name: 'Icon',
    props: {
        symbol: {
            type: String,
            required: true
        },
        height: {
            type: [Number, String],
            default: 16
        },
        width: {
            type: [Number, String],
            default: 16
        }
    },
    render (createElement) {
        return createElement('i', {
            domProps: {
                innerHTML: octicons[this.symbol].toSVG({
                    height: this.height,
                    width: this.width
                })
            }
        })
    }
}
</script>
