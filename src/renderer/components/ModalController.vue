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
import EditProject from '@/components/modals/EditProject'
import AddRepositories from '@/components/modals/AddRepositories'
import AlertStack from '@/components/modals/AlertStack'
import ManageFrameworks from '@/components/modals/ManageFrameworks'
import RemoveProject from '@/components/modals/RemoveProject'
import RemoveRepository from '@/components/modals/RemoveRepository'
import ResetSettings from '@/components/modals/ResetSettings'

export default {
    name: 'ModalController',
    components: {
        EditProject,
        AddRepositories,
        AlertStack,
        ManageFrameworks,
        RemoveProject,
        RemoveRepository,
        ResetSettings
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
