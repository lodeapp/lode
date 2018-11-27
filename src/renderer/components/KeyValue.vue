<template>
    <div class="object">
        <div class="key-value" v-for="(value, key) in object" :key="key">
            <div class="key">{{ key }}</div>
            <div class="value">
                <pre v-if="isObject(value)">{{ value }}</pre>
                <span v-else>{{ value }}</span>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'KeyValue',
    props: {
        object: {
            type: Object,
            default () {
                return {}
            }
        }
    },
    methods: {
        isObject (value) {
            return typeof value === 'object' || Array.isArray(value)
        }
    }
}
</script>
