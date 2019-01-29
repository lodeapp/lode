<template>
    <Modal :dismissable="true" size="sm">
        <div class="about">
            <img :src="logo">
            <h4>Lode</h4>
            <p v-markdown.set="(new Date()).getFullYear()">&copy; 2018 - :0 Tomas Buteler. All rights reserved.</p>
            <p><a href="#" @click.prevent="showLicenses">Open Source Notices</a></p>
        </div>
    </Modal>
</template>

<script>
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
    methods: {
        showLicenses () {
            this.$emit('hide')
            this.$modal.open('Licenses')
        }
    }
}
</script>
