<template>
    <div class="download">
        <template v-if="os === 'linux'">
            <a href="#" class="btn btn-large btn-primary f3 my-3" @click.stop.prevent="notify">Notify me on Linux release</a>
            <a class="github btn btn-large f3 my-3 mx-3" href="https://github.com/lodeapp/lode">
                <Icon symbol="mark-github" height="32" width="32" />
                GitHub
            </a>
            <small class="version">
                <span>Latest version: <a :href="`/release-notes/#${version('mac')}`">{{ version('mac') }}</a></span><Badge v-if="isBeta('mac')" text="Beta" />
                <span>&mdash; Download for <a :href="path('mac')" @click="download('mac')">macOS</a>. Windows and Linux coming&nbsp;soon.</span>
            </small>
            <small class="d-block">By downloading, you agree to the <a href="/terms/">Terms&nbsp;&&nbsp;Conditions</a>.</small>
        </template>
        <template v-else-if="os === 'win'">
            <a href="#" class="btn btn-large btn-primary f3 my-3" @click.stop.prevent="notify">Notify me on Windows release</a>
            <a class="github btn btn-large f3 my-3 mx-3" href="https://github.com/lodeapp/lode">
                <Icon symbol="mark-github" height="32" width="32" />
                GitHub
            </a>
            <small class="version">
                <span>Latest version: <a :href="`/release-notes/#${version('mac')}`">{{ version('mac') }}</a></span><Badge v-if="isBeta('mac')" text="Beta" />
                <span>&mdash; Download for <a :href="path('mac')" @click="download('mac')">macOS</a>. Windows and Linux coming&nbsp;soon.</span>
            </small>
            <small class="d-block">By downloading, you agree to the <a href="/terms/">Terms&nbsp;&&nbsp;Conditions</a>.</small>
        </template>
        <template v-else>
            <a class="btn btn-large btn-primary f3 my-3" :href="path('mac')" @click="download('mac')">Download for macOS</a>
            <a class="github btn btn-large f3 my-3 mx-3" href="https://github.com/lodeapp/lode">
                <Icon symbol="mark-github" height="32" width="32" />
                GitHub
            </a>
            <small class="version">
                <span>Latest version: <a :href="`/release-notes/#${version('mac')}`">{{ version('mac') }}</a></span><Badge v-if="isBeta('mac')" text="Beta" />
                <span>&mdash; Windows and Linux coming&nbsp;soon. <a href="#" @click.stop.prevent="notify">Get notified</a>.</span>
            </small>
            <small class="d-block">By downloading, you agree to the <a href="/terms/">Terms&nbsp;&&nbsp;Conditions</a>.</small>
        </template>
    </div>
</template>

<script>
import mac from '../../../support/latest-mac.json'

export default {
    data () {
        return {
            os: '',
            mac
        }
    },
    beforeMount () {
        if (navigator.platform.match(/(Mac|iPhone|iPod|iPad)/i)) {
            this.os = 'mac'
        } else if (navigator.platform.match(/(Win32|Win64|Windows|WinCE)/i)) {
            this.os = 'win'
        } else if (navigator.platform.match(/(Linux)/i)) {
            this.os = 'linux'
        }
    },
    methods: {
        isBeta (os) {
            return this[os].version.match(/^0\./)
        },
        path (os) {
            return this[os].path
        },
        version (os) {
            return this[os].version
        },
        download (os) {
            this.$metrics.event('Download', 'Download from overview', os)
        },
        notify () {
            // Focus on first input of the mailing list
            this.$root.$el.querySelector('.mailing-list input').focus()
        }
    }
}
</script>
