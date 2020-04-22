<template>
    <div
        class="console collapsible-group"
        :class="[`console--${output.render}`]"
    >
        <Collapsible
            :show="!isLarge"
            :copy="$code.asString(output.content)"
            :class="{ 'has-context-menu': hasContextMenu(0) }"
            @contextmenu.native.stop.prevent="onContextMenu(output, 0, $event)"
        >
            <template v-slot:header>
                <Filename :key="toRelative(output.file)" :truncate="true" @dblclick.native.stop />
                <span v-if="output.line" class="Label Label--outline Label--idle">{{ 'Line :0' | set(output.line) }}</span>
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
