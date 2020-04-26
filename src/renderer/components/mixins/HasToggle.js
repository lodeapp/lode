export default {
    props: {
        selectable: {
            type: Boolean,
            default: false
        }
    },
    data () {
        return {
            selected: this.select || this.model.selected || false,
            // @TODO: persist
            selective: 0
        }
    },
    computed: {
        identifier () {
            return this.model.id || this.model.file
        },
        partial () {
            return this.selected && this.selective < (this.model.tests || []).length
        }
    },
    methods: {
        onSelect (event) {
            if (this.running) {
                return
            }
            this.selected = this.selective > 0 && this.selected ? false : !this.selected
            this.selective = this.selected ? (this.model.tests || []).legth : 0
            this.$emit('select', this.selected, [this.identifier])
            this.$emit('parent-select', this.selected)
        },
        onChildSelect (selected, context) {
            this.selective += (selected ? 1 : -1)
            context.unshift(this.identifier)
            this.$emit('select', selected, context)
        }
    }
}
