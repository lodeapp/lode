<template>
    <div class="mailing-list">
        <div class="mx-auto">
            <h3 class="f1-light">Is your testing framework not&nbsp;supported?</h3>
            <p class="f3-light mt-1 mb-3">Sign up to the mailing list to be notified when your preferred OS or framework&nbsp;launches.</p>
            <!-- Begin Mailchimp Signup Form -->
            <div id="mc_embed_signup">
                <form action="https://recontra.us20.list-manage.com/subscribe/post?u=b3b5f0ed83fd053a6eb895d96&amp;id=bafac68959" method="post" id="mc-embedded-subscribe-form" name="mc-embedded-subscribe-form" class="validate" target="_blank" novalidate @submit="submit">
                    <div id="mc_embed_signup_scroll">
                        <div class="d-flex flex-column flex-md-row flex-md-justify-center">
                            <div class="mc-field-group">
                                <label for="mce-EMAIL">Email Address </label>
                                <input type="email" value="" name="EMAIL" class="required email" id="mce-EMAIL" placeholder="name@example.com">
                            </div>
                            <div class="mc-field-group">
                                <label for="mce-FRAMEWORK">Framework (Optional) </label>
                                <input type="text" value="" name="FRAMEWORK" class="" id="mce-FRAMEWORK" placeholder="Framework or OS (Optional)">
                            </div>
                        </div>
                        <div id="mergeRow-gdpr" class="mergeRow gdpr-mergeRow content__gdprBlock mc-field-group">
                            <div class="content__gdpr">
                                <label>Consent</label>
                                <p>We value your privacy. We will only contact you for important updates.</p>
                                <fieldset class="mc_fieldset gdprRequired mc-field-group" name="interestgroup_field">
                                    <label class="checkbox subfield" for="gdpr_25821"><input type="checkbox" id="gdpr_25821" name="gdpr[25821]" value="Y" class="av-checkbox gdpr"><span>I consent to the treatment of my data</span> </label>
                                </fieldset>
                                <p>Lode will use the information you provide on this form to be in touch with you and to provide updates. You can unsubscribe at any time by clicking the unsubscribe link in the footer of any email you receive from us. For more information about our privacy practices please visit our website.</p>
                            </div>
                            <div class="content__gdprLegal">
                                <p>We use Mailchimp as our marketing platform. By clicking below to subscribe, you acknowledge that your information will be transferred to Mailchimp for processing. <a href="https://mailchimp.com/legal/" target="_blank">Learn more about Mailchimp's privacy practices here.</a></p>
                            </div>
                        </div>
                        <div id="mce-responses" class="clear">
                            <div class="response" id="mce-error-response" style="display:none"></div>
                            <div class="response" id="mce-success-response" style="display:none"></div>
                        </div> <!-- real people should not fill this in and expect good things - do not remove this or risk form bot signups-->
                        <div style="position: absolute; left: -5000px;" aria-hidden="true"><input type="text" name="b_b3b5f0ed83fd053a6eb895d96_bafac68959" tabindex="-1" value=""></div>
                        <div class="clear"><input type="submit" value="Subscribe" name="subscribe" id="mc-embedded-subscribe" class="button"></div>
                    </div>
                </form>
            </div>
            <!--End mc_embed_signup-->
        </div>
    </div>
</template>

<script>
export default {
    methods: {
        submit () {
            this.$metrics.event('Subscribe', 'Subscribed from overview')
        }
    }
}
</script>
