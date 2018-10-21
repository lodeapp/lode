<template>
    <div>
        <span v-if="framework.selective">
            {{ '1 suite selected|:n suites selected' | plural(framework.selectedCount.suites) }}
        </span>
        <span v-else>
            {{ '{0} No tests found|{1} 1 suite|{2,*} :n suites' | plural(framework.suites.length) }}
        </span>
    </div>
</template>

<script>
export default {
    name: 'TestCount',
    props: {
        framework: {
            type: Object,
            required: true
        }
    }
}
</script>
