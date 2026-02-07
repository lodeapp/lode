<script>
export default {
    name: 'KeyValue',
    props: {
        object: {
            type: Object,
            default() {
                return {}
            },
        },
    },
    methods: {
        isObject(value) {
            return typeof value === 'object' || Array.isArray(value)
        },
    },
}
</script>

<template>
    <div class="object">
        <div v-for="(value, key) in object" :key="key" class="key-value">
            <div class="key">
                {{ key }}
            </div>
            <div class="value">
                <pre v-if="isObject(value)">{{ value }}</pre>
                <span v-else>{{ value }}</span>
            </div>
        </div>
    </div>
</template>
