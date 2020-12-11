<template>
    <div v-if="show">
        <div class="cookie-container">
            <div class="cookie-notification">
                <span>
                    By using this website, you agree to our <RouterLink to="/cookie-policy/">cookie&nbsp;policy</RouterLink>
                </span>
                <button @click="consent">Close</button>
            </div>
        </div>
    </div>
</template>

<script>
import Cookies from 'js-cookie'

export default {
    data () {
        return {
            show: false
        }
    },
    mounted () {
        if (!Cookies.get('cookie_consent')) {
            this.show = true
        }
    },
    methods: {
        consent () {
            Cookies.set('cookie_consent', Date.now(), { expires: 365 })
            this.show = false
        }
    }
}
</script>
