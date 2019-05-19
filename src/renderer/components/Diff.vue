<template>
    <div class="diff">
        <template v-if="hasSupporting">
            <div class="collapsible-group">
                <Collapsible
                    v-for="(part, key) in parts"
                    :show="key === 'diff' || !hasDiff"
                    :copy="part"
                    :key="key"
                >
                    <template v-slot:header>
                        <span v-html="partName(key)"></span>
                    </template>
                    <template>
                        <Snippet :code="part" :language="key === 'diff' ? 'diff' : ''" />
                    </template>
                </Collapsible>
            </div>
        </template>
        <Snippet v-else :code="diff" language="diff" />
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
            return _get(this.parts, 'diff', '')
        },
        parts () {
            if (typeof this.content === 'string') {
                return {
                    'diff': this.content
                }
            }

            return _pickBy({
                'diff': _get(this.content, '@', ''),
                'actual': _get(this.content, '+', ''),
                'expected': _get(this.content, '-', ''),
                'expected-partial': _get(this.content, 'q', '')
            }, _identity)
        },
        hasSupporting () {
            return Object.keys(this.parts).length > 1
        },
        hasDiff () {
            return typeof this.parts.diff !== 'undefined'
        }
    },
    methods: {
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
