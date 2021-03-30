<template>
    <div
        class="console collapsible-group"
        :class="[`console--${output.render}`]"
    >
        <Collapsible
            :show="!isLarge"
            :copy="relativePath(output.file)"
            :class="{ 'has-context-menu': hasContextMenu(0) }"
            @contextmenu.stop.prevent="onContextMenu(output.file, 0)"
        >
            <template #header>
                <Filename :path="relativePath(output.file)" :truncate="true" @dblclick.stop />
                <span v-if="output.line" class="Label Label--outline Label--idle">{{ $string.set('Line :0', output.line) }}</span>
                <span class="Label Label--outline Label--normal"><code>{{ output.type }}</code></span>
            </template>
            <Ansi v-if="output.render === 'ansi'" :content="output.content" />
            <Snippet v-else-if="output.render === 'code'" :code="output.content" :language="output.language" />
            <div v-else-if="output.render === 'html'" v-html="output.content"></div>
            <div v-else>{{ output.content }}</div>
        </Collapsible>
    </div>
</template>

<script>
import Ansi from '@/components/Ansi'
import Collapsible from '@/components/Collapsible'
import Snippet from '@/components/Snippet'
import HasFile from '@/components/mixins/HasFile'

export default {
    name: 'Console',
    components: {
        Ansi,
        Collapsible,
        Snippet
    },
    mixins: [
        HasFile
    ],
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
