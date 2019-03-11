<template>
    <div class="trace" :class="{ 'trace-group': isNested }">
        <template v-if="isNested">
            <div v-for="(item, index) in trace" :key="index">
                <div v-if="index" class="trace-link">
                    <Icon symbol="issue-reopened" />
                    <span>Previous Error</span>
                </div>
                <Trace
                    :repository="repository"
                    :framework="framework"
                    :trace="item"
                />
            </div>
        </template>
        <template v-else>
            <div class="collapsible-group">
                <Collapsible v-for="(item, index) in trace" :key="index" :show="!index">
                    <template v-slot:header>
                        <template v-if="typeof item === 'object'">
                            <Filename :path="toRelative(item.file)" @dblclick.native.stop />
                            <span v-if="item.function" class="Label Label--outline Label--normal"><code>{{ item.function }}</code></span>
                            <span v-if="item.line" class="Label Label--outline Label--idle">{{ 'Line :0' | set(item.line) }}</span>
                        </template>
                        <template v-else>
                            {{ item }}
                        </template>
                    </template>
                    <template v-if="typeof item === 'object'">
                        <Snippet :code="item.code" :line="item.line" :language="item.lang" />
                    </template>
                </Collapsible>
            </div>
        </template>
    </div>
</template>

<script>
import * as Path from 'path'
import _isArray from 'lodash/isArray'
import Collapsible from '@/components/Collapsible'
import Filename from '@/components/Filename'
import Snippet from '@/components/Snippet'

export default {
    name: 'Trace',
    components: {
        Collapsible,
        Filename,
        Snippet
    },
    props: {
        repository: {
            type: Object,
            required: true
        },
        framework: {
            type: Object,
            required: true
        },
        trace: {
            type: Array,
            required: true
        }
    },
    computed: {
        isNested () {
            return this.trace.length && this.trace[0] && _isArray(this.trace[0])
        }
    },
    methods: {
        toRelative (path) {
            if (!this.framework || !this.repository) {
                return path
            }
            let root = this.framework.runsInRemote ? this.framework.remotePath : this.repository.path
            if (!root) {
                return path
            } else if (this.framework.path) {
                root = Path.join(root, this.framework.path)
            }
            return Path.relative(root, path)
        }
    }
}
</script>
