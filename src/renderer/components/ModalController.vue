<script>
import { mapState } from 'pinia'
import { useModalsStore } from '@/stores'

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
        ...Modals,
    },
    computed: {
        ...mapState(useModalsStore, ['hasModals', 'modals']),
    },
    methods: {
        hide() {
            this.$modal.close()
        },
    },
}
</script>

<template>
    <transition-group name="modal">
        <template v-if="hasModals">
            <component
                :is="modal"
                v-for="(modal, index) in modals"
                :key="`modal-${index}`"
                v-bind="$modal.getProperties(index)"
                :class="{ 'is-last': index + 1 === modals.length }"
                @hide="hide"
            />
        </template>
        <div v-if="hasModals" key="backdrop" class="modal-backdrop"></div>
    </transition-group>
</template>
