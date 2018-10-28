<script>
import Vue from 'vue'
export default {
    name: 'Icon',
    functional: true,
    props: {
        symbol: {
            type: String,
            required: true
        }
    },
    render (createElement, context) {
        return createElement('i', Object.assign({
            class: {
                octicon: true
            },
            domProps: {
                innerHTML: Vue.prototype.$icon[context.props.symbol].toSVG()
            }
        }, context.data))
    }
}
</script>
