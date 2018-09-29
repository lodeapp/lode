<template>
    <div class="test" :class="[test.status]" @click.stop="show = !show">
        <div>
            <span style="display: inline-block; min-width: 18px; min-height: 19px; cursor: pointer;" @click.stop="onSelective">
                <input v-if="toggles && selective" type="checkbox" v-model="selected" @click.stop>
            </span>
            {{ test.displayName }}
        </div>
        <div v-if="result.feedback">
            <div v-show="show">
                <pre v-html="result.feedback"></pre>
            </div>
        </div>
    </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
export default {
    name: 'Test',
    props: {
        test: {
            type: Object,
            required: true
        },
        toggles: {
            type: Boolean,
            default: false
        }
    },
    data () {
        return {
            show: false
        }
    },
    computed: {
        result () {
            return this.test.result || {}
        },
        selected: {
            get () {
                return this.test.selected
            },
            set (checked) {
                this.test.toggleSelected(checked)
                this.$emit('selected', checked)
            }
        },
        ...mapGetters({
            selective: 'tree/selective'
        })
    },
    methods: {
        onSelective () {
            this.selected = true
            this.enableSelective()
        },
        ...mapActions({
            enableSelective: 'tree/enableSelective'
        })
    }
}
</script>
