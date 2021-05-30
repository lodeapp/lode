<template>
    <Modal title="Terms and Conditions">
        <div class="terms">
            <pre
                v-if="terms"
                v-markdown.block="terms"
                @click.prevent="$input.on($event, 'a', openLink)"
            ></pre>
        </div>
        <template #footer>
            <div class="modal-footer tertiary flex-justify-end">
                <button type="button" class="btn btn-sm btn-primary" @click="close">
                    Close
                </button>
            </div>
        </template>
    </Modal>
</template>

<script>
import Modal from '@/components/modals/mixins/modal'

export default {
    name: 'Licenses',
    mixins: [Modal],
    data () {
        return {
            terms: ''
        }
    },
    async created () {
        this.terms = await Lode.ipc.invoke('terms')
    },
    methods: {
        openLink (event) {
            this.$root.openExternal(event.target.href)
        }
    }
}
</script>
