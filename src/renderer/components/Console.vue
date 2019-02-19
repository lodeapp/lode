<template>
    <div class="collapsible-group">
        <Collapsible class="console" :class="[`console--${output.render}`]" :show="!isLarge">
            <template v-slot:header>
                <span class="Label Label--outline Label--normal"><code>{{ output.type }}</code></span>
                <span v-if="output.line" class="Label Label--outline Label--idle">{{ 'Line :0' | set(output.line) }}</span>
            </template>
            <Ansi v-if="output.render === 'ansi'" :content="output.content" />
            <Snippet v-else-if="output.render === 'snippet'" :snippet="output.content" :language="output.language" />
            <div v-else-if="output.render === 'html'" v-html="output.content"></div>
            <div v-else>{{ output.content }}</div>
        </Collapsible>
    </div>
</template>

<script>
import Ansi from '@/components/Ansi'
import Collapsible from '@/components/Collapsible'
import Snippet from '@/components/Snippet'

export default {
    name: 'Console',
    components: {
        Ansi,
        Collapsible,
        Snippet
    },
    props: {
        output: {
            type: Object,
            required: true
        }
    },
    computed: {
        isLarge () {
            return this.output.content.length > 10000
        }
    }
}
</script>
