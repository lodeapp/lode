<template>
    <transition-group name="modal" tag="div">
        <template v-if="hasModals">
            <component
                :key="`modal-${index}`"
                :is="modal.name"
                v-bind="modal.properties"
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

export default {
    name: 'ModalController',
    computed: {
        ...mapGetters({
            hasModals: 'modal/hasModals',
            modals: 'modal/modals'
        })
    },
    methods: {
        hide () {
            this.$modal.close()
        }
    }
}
</script>
