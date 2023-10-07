<template>
    <Modal :dismissable="true" size="sm">
        <div class="about">
            <img :src="logo">
            <h4>Lode</h4>
            <p class="version">
                <span>{{ $string.set('Version :0 (:1)', version, arch) }}</span>
                <a href="#" @click.prevent="openReleaseNotes">Release notes</a>
            </p>
            <hr>
            <p class="version">
                <span>{{ $string.set('Electron v:0', electronVersion) }}</span>
                <span>{{ $string.set('Node v:0', nodeVersion) }}</span>
            </p>
            <hr>
            <p v-markdown.set="(new Date()).getFullYear()">&copy; 2018 - :0 Tomas Buteler. All rights reserved.</p>
            <p class="legal">
                <a href="#" @click.prevent="showTerms">Terms and Conditions</a>
                <a href="#" @click.prevent="showLicenses">Open Source Notices</a>
            </p>
        </div>
    </Modal>
</template>

<script>
import Modal from '@/components/modals/mixins/modal'

export default {
    name: 'About',
    mixins: [Modal],
    data () {
        return {
            logo: 'static/icons/512x512.png'
        }
    },
    computed: {
        version () {
            return this.$root.version
        },
        arch () {
            return this.$root.arch
        },
        electronVersion () {
            return (navigator.userAgent.match(new RegExp('Electron/[0-9\.]{1,}'))[0] || '').replace('Electron/', '')
        },
        nodeVersion () {
            return this.$root.nodeVersion
        }
    },
    methods: {
        openReleaseNotes () {
            this.$root.openExternal(`https://lode.run/release-notes/#${this.version}`)
        },
        showTerms () {
            this.close()
            this.$modal.open('Terms')
        },
        showLicenses () {
            this.close()
            this.$modal.open('Licenses')
        }
    }
}
</script>
