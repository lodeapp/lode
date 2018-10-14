<template>
    <div>
        <span v-if="!selective">
            {{ '{0} No tests found|{1} 1 suite|{2,*} :n suites' | plural(framework.suites.length) }}
        </span>
        <span v-else>
            {{ '1 suite selected|:n suites selected' | plural(framework.selectedCount.suites) }}
        </span>
    </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
    name: 'TestCount',
    props: {
        framework: {
            type: Object,
            required: true
        }
    },
    computed: {
        ...mapGetters({
            selective: 'tree/selective'
        })
    }
}
</script>
