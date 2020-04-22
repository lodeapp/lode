<template>
    <div class="trace" :class="{ 'trace-group': isNested }">
        <template v-if="isNested">
            <div v-for="(item, index) in trace" :key="index">
                <div v-if="index" class="trace-link">
                    <Icon symbol="issue-reopened" />
                    <span>Previous Error</span>
                </div>
                <Trace
                    :context="context"
                    :trace="item"
                />
            </div>
        </template>
        <template v-else>
            <div class="collapsible-group">
                <Collapsible
                    v-for="(item, index) in trace"
                    :key="index"
                    :show="!index"
                    :copy="$code.asString(item.code)"
                    :class="{ 'has-context-menu': hasContextMenu(index) }"
                    @contextmenu.native.stop.prevent="onContextMenu(item, index, $event)"
                >
                    <template v-slot:header>
                        <template v-if="typeof item === 'object'">
                            <Filename :key="toRelative(item.file)" :truncate="true" @dblclick.native.stop />
                            <span v-if="item.function" class="Label Label--outline Label--normal"><code>{{ item.function }}</code></span>
                            <span v-if="item.line" class="Label Label--outline Label--idle">{{ 'Line :0' | set(item.line) }}</span>
                        </template>
                        <template v-else>
                            {{ item }}
                        </template>
                    </template>
                    <template v-if="typeof item === 'object' && item.code">
                        <Snippet
                            :code="item.code"
                            :line="item.line"
                            :language="item.lang"
                        />
                    </template>
                </Collapsible>
            </div>
        </template>
    </div>
</template>

<script>
import _isArray from 'lodash/isArray'
import Collapsible from '@/components/Collapsible'
import Filename from '@/components/Filename'
import Snippet from '@/components/Snippet'
import HasFile from '@/components/mixins/HasFile'

export default {
    name: 'Trace',
    components: {
        Collapsible,
        Filename,
        Snippet
    },
    mixins: [
        HasFile
    ],
    props: {
        trace: {
            type: Array,
            required: true
        }
    },
    computed: {
        isNested () {
            return this.trace.length && this.trace[0] && _isArray(this.trace[0])
        }
    }
}
</script>
