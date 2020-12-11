<template>
    <Modal title="Terms and Conditions">
        <div class="terms">
            <pre
                v-if="terms"
                v-markdown.block="terms"
                @click.prevent="$input.on($event, 'a', openLink)"
            ></pre>
        </div>
        <div slot="footer" class="modal-footer tertiary flex-justify-end">
            <button type="button" class="btn btn-sm btn-primary" @click="$emit('hide')">
                Close
            </button>
        </div>
    </Modal>
</template>

<script>
import Modal from '@/components/modals/Modal'

export default {
    name: 'Licenses',
    components: {
        Modal
    },
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
