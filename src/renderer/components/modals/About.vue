<template>
    <Modal :dismissable="true" size="sm">
        <div class="about">
            <img :src="logo">
            <h4>Lode</h4>
            <p>{{ $string.set('Version :0', version) }}</p>
            <p v-markdown.set="(new Date()).getFullYear()">&copy; 2018 - :0 Recontra, U.L. All rights reserved.</p>
            <p class="legal">
                <a href="#" @click.prevent="showTerms">Terms and Conditions</a>
                <a href="#" @click.prevent="showLicenses">Open Source Notices</a>
            </p>
        </div>
    </Modal>
</template>

<script>
import { remote } from 'electron'
import Modal from '@/components/modals/Modal'

export default {
    name: 'About',
    components: {
        Modal
    },
    data () {
        return {
            logo: 'static/icons/256x256.png'
        }
    },
    computed: {
        version () {
            return remote.app.getVersion()
        }
    },
    methods: {
        showTerms () {
            this.$emit('hide')
            this.$modal.open('Terms')
        },
        showLicenses () {
            this.$emit('hide')
            this.$modal.open('Licenses')
        }
    }
}
</script>
