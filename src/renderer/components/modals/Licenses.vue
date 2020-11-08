<template>
    <Modal title="Open Source Notices">
        <template v-if="licenses">
            <div v-if="!licenses.length">
                <p>An error ocurred while loading third party licenses. Please contact the authors for licensing information.</p>
            </div>
            <div v-else>
                <p>The following sets forth attribution notices for third party software that may be contained in portions of the Lode application. We thank the open source community for all of their contributions.</p>
                <div v-for="license in licenses" class="license" :key="license.id">
                    <h5 v-if="license.repository"><a href="#" @click.prevent="$root.openExternal(license.repository)">{{ license.id }}</a></h5>
                    <h5 v-else>{{ license.id }}</h5>
                    <pre>{{ license.license }}</pre>
                </div>
            </div>
            <div slot="footer" class="modal-footer tertiary flex-justify-end">
                <button type="button" class="btn btn-sm btn-primary" @click="$emit('hide')">
                    Close
                </button>
            </div>
        </template>
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
            licenses: null
        }
    },
    async created () {
        try {
            const licenses = await Lode.ipc.invoke('licenses')
            this.licenses = licenses ? JSON.parse(licenses) : []
        } catch (_) {
            this.licenses = []
        }
    }
}
</script>
