<template>
    <div class="Box console" :class="[`console--${type}`]">
        <div class="Box-header">
            <span class="Label Label--outline Label--normal"><code>{{ output.type }}</code></span>
            <span class="Label Label--outline Label--idle">{{ 'Line :0' | set(output.line) }}</span>
        </div>
        <div class="Box-body">
            <Ansi v-if="type === 'ansi'" :content="output.content" />
            <div v-else>{{ output.content }}</div>
        </div>
    </div>
</template>

<script>
import Ansi from '@/components/Ansi'

export default {
    name: 'Console',
    components: {
        Ansi
    },
    props: {
        output: {
            type: Object,
            required: true
        },
        type: {
            type: String,
            default: 'ansi'
        }
    }
}
</script>
