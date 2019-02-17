<template>
    <div class="Box Box--condensed">
        <div class="Box-header" v-for="item in trace" :key="$string.from(item)">
            {{ item }}
        </div>
    </div>
</template>

<script>
export default {
    name: 'Trace',
    props: {
        trace: {
            type: Array,
            required: true
        }
    }
}
</script>
