<template>
    <transition-group name="modal">
        <template v-if="hasModals">
            <component
                v-for="(modal, index) in modals"
                :key="`modal-${index}`"
                :is="modal"
                v-bind="$modal.getProperties(index)"
                :class="{ 'is-last': index + 1 === modals.length }"
                @hide="hide"
            />
        </template>
        <div key="backdrop" class="modal-backdrop" v-if="hasModals"></div>
    </transition-group>
</template>

<script>
import { mapGetters } from 'vuex'

// Load all components from modals directory
const modalFiles = import.meta.glob('./modals/**/*.vue', { eager: true })
const Modals = {}
for (const path in modalFiles) {
    const name = path.replace(/^\.\/modals\/(.+)\.vue$/, '$1')
    Modals[name] = modalFiles[path].default
}

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
