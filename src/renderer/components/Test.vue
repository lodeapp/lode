<template>
    <div class="test" :class="groupClasses" @click.stop="toggleChildren">
        <div class="header">
            <div v-if="toggles" class="input--select" @click.stop="onSelective">
                <input type="checkbox" v-model="selected" @click.stop>
            </div>
            <div>{{ test.displayName }}</div>
        </div>
        <div v-if="hasChildren">
            <div v-show="show">
                <pre v-html="result.feedback"></pre>
            </div>
        </div>
    </div>
</template>

<script>
import { mapActions } from 'vuex'
import group from '@/mixins/group'

export default {
    name: 'Test',
    mixins: [group],
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
        model () {
            return this.test
        },
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
        hasChildren () {
            return this.result.feedback
        }
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
