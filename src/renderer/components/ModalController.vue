<template>
    <transition-group name="modal" tag="div">
        <template v-if="hasModals">
            <component
                :key="`modal-${index}`"
                :is="modal"
                v-bind="$modal.getProperties(index)"
                :class="{ 'is-last': index + 1 === modals.length }"
                v-for="(modal, index) in modals"
                @hide="hide"
            />
        </template>
        <div key="backdrop" class="modal-backdrop" v-if="hasModals"></div>
    </transition-group>
</template>

<script>
import { mapGetters } from 'vuex'

// Load all components from modals directory
const context = require.context('@/components/modals', true, /\.vue$/)
const Modals = {}
context.keys().forEach((key) => {
    Modals[key.replace(/^\.\/([aA0-zZ9]+)\.vue$/, '$1')] = context(key).default
})

export default {
    name: 'ModalController',
    components: {
        ...Modals
    },
    computed: {
        ...mapGetters({
            hasModals: 'modals/hasModals',
            modals: 'modals/modals'
        })
    },
    methods: {
        hide () {
            this.$modal.close()
        }
    }
}
</script>
