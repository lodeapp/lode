<template>
    <div class="test" :class="[test.status]" @click.stop="show = !show">
        <div>
            <input v-if="toggles" type="checkbox" v-model="selected" @click.stop>
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
        }
    }
}
</script>
