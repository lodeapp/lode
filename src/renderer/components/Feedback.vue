<template>
    <div class="feedback">
        <h4>{{ content.title }}</h4>
        <div class="message">
            <p v-if="text">{{ text }}</p>
            <template v-if="content.ansi">
                <Ansi :content="content.ansi" />
            </template>
        </div>
        <Diff v-if="content.diff" :content="content.diff" />
        <h4 v-if="trace && trace.length" class="text-muted">
            {{ $string.plural('Exception|Exceptions', trace.length) }}
            <small class="float-right">
                <button type="button" class="btn-link more-actions" title="Reverse order" @click.prevent="reverse = !reverse">
                    <Icon symbol="arrow-switch" class="rotate-90" />
                </button>
            </small>
        </h4>
        <Trace
            v-if="trace && trace.length"
            :trace="trace"
            :key="$string.from(trace)"
        />
        <div class="meta-group" v-if="content.meta">
            <div v-for="(meta, index) in content.meta" :key="index">
                <h4 class="text-muted">{{ index.replace(/_/g, ' ') }}</h4>
                <MetaTable :object="meta" />
            </div>
        </div>
    </div>
</template>

<script>
import { cloneDeep, isArray, reverse } from 'lodash'
import Ansi from '@/components/Ansi.vue'
import Diff from '@/components/Diff.vue'
import MetaTable from '@/components/MetaTable.vue'
import Trace from '@/components/Trace.vue'

export default {
    name: 'Feedback',
    components: {
        Ansi,
        Diff,
        MetaTable,
        Trace
    },
    props: {
        content: {
            type: Object,
            default () {
                return {}
            }
        }
    },
    data () {
        return {
            text: null,
            reverse: false
        }
    },
    computed: {
        trace () {
            if (!this.reverse) {
                return this.content.trace
            }

            let trace = cloneDeep(this.content.trace)
            trace = trace.map(t => {
                if (isArray(t)) {
                    reverse(t)
                }
                return t
            })
            reverse(trace)
            return trace
        }
    },
    async created () {
        this.text = await this.processText(this.content.text)
    },
    methods: {
        async processText (text) {
            return (await Lode.ipc.invoke('test-feedback-text', text))
        }
    }
}
</script>
