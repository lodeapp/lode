<template>
    <div class="diff">
        <template v-if="hasSupporting">
            <div class="collapsible-group">
                <Collapsible
                    v-for="(part, key) in parts"
                    :show="key === 'diff' || !hasDiff"
                    :key="key"
                >
                    <template #header>
                        <span v-html="partName(key)"></span>
                    </template>
                    <Snippet
                        :code="part"
                        :language="key === 'diff' ? 'diff' : ''"
                        :copy="part"
                    />
                </Collapsible>
            </div>
        </template>
        <Snippet v-else :code="diff" language="diff" :copy="diff" />
    </div>
</template>

<script>
import { get, identity, pickBy } from 'lodash'
import Collapsible from '@/components/Collapsible.vue'
import Snippet from '@/components/Snippet.vue'

export default {
    name: 'Diff',
    components: {
        Collapsible,
        Snippet
    },
    props: {
        content: {
            type: [String, Object],
            required: true
        }
    },
    computed: {
        diff () {
            return this.formatDiff(get(this.parts, 'diff', ''))
        },
        parts () {
            if (typeof this.content === 'string') {
                return {
                    'diff': this.content
                }
            }

            return pickBy({
                'diff': this.formatDiff(get(this.content, '@', '')),
                'actual': get(this.content, '+', ''),
                'expected': get(this.content, '-', ''),
                'expected-partial': get(this.content, 'q', '')
            }, identity)
        },
        hasSupporting () {
            return typeof this.content !== 'string'
        },
        hasDiff () {
            return typeof this.parts.diff !== 'undefined'
        }
    },
    methods: {
        formatDiff (diff) {
            // Clean chunk headers without any line information.
            return diff.replace(/\n@@ @@\n/, '\n\n')
        },
        partName (key) {
            return get({
                'diff': 'Difference',
                'actual': '<span class="text-mono">+++</span> Actual',
                'expected': '<span class="text-mono">---</span> Expected',
                'expected-partial': '<span class="text-mono">---</span> Expected (partial)'
            }, key, '')
        }
    }
}
</script>
