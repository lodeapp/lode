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
import _get from 'lodash/get'
import _identity from 'lodash/identity'
import _pickBy from 'lodash/pickBy'
import Collapsible from '@/components/Collapsible'
import Snippet from '@/components/Snippet'

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
            return this.formatDiff(_get(this.parts, 'diff', ''))
        },
        parts () {
            if (typeof this.content === 'string') {
                return {
                    'diff': this.content
                }
            }

            return _pickBy({
                'diff': this.formatDiff(_get(this.content, '@', '')),
                'actual': _get(this.content, '+', ''),
                'expected': _get(this.content, '-', ''),
                'expected-partial': _get(this.content, 'q', '')
            }, _identity)
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
            return _get({
                'diff': 'Difference',
                'actual': '<span class="text-mono">+++</span> Actual',
                'expected': '<span class="text-mono">---</span> Expected',
                'expected-partial': '<span class="text-mono">---</span> Expected (partial)'
            }, key, '')
        }
    }
}
</script>
