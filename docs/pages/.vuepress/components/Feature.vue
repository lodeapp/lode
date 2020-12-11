<template>
    <div class="feature d-lg-flex flex-items-center" :class="[`feature--${slug}`]">
        <img :src="`${slug}.png`" class="feature-screenshot">
        <div class="flex-auto text-lg-left col-lg-4 p-3">
            <h3 class="f1-light">{{ title }}</h3>
            <p class="mt-3" v-html="description"></p>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        slug: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        }
    }
}
</script>
