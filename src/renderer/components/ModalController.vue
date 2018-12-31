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
import AlertStack from '@/components/modals/AlertStack'
import ResetSettings from '@/components/modals/ResetSettings'
import AddProject from '@/components/modals/AddProject'
import AddRepositories from '@/components/modals/AddRepositories'
import AddFrameworks from '@/components/modals/AddFrameworks'

export default {
    name: 'ModalController',
    components: {
        AlertStack,
        ResetSettings,
        AddProject,
        AddRepositories,
        AddFrameworks
    },
    data () {
        return {
            modals: this.$modal.modals
        }
    },
    computed: {
        hasModals () {
            return this.modals.length > 0
        }
    },
    methods: {
        hide () {
            this.$modal.close()
        }
    }
}
</script>
