<template>
    <Modal title="Terms and Conditions">
        <div class="terms">
            <pre @click.prevent="$input.on($event, 'a', openLink)" v-markdown="license"></pre>
        </div>
        <div slot="footer" class="modal-footer tertiary flex-justify-end">
            <button type="button" class="btn btn-sm btn-primary" @click="$emit('hide')">
                Close
            </button>
        </div>
    </Modal>
</template>

<script>
import Fs from 'fs'
import Path from 'path'
import Modal from '@/components/modals/Modal'

export default {
    name: 'Licenses',
    components: {
        Modal
    },
    data () {
        return {
            license: Fs.readFileSync(Path.join(__static, '/LICENSE'), 'utf8') || ''
        }
    },
    methods: {
        openLink (event) {
            this.$root.openExternal(event.target.href)
        }
    }
}
</script>
