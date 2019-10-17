<template>
    <div class="feedback">
        <h4>{{ content.title }}</h4>
        <div class="message">
            <p v-if="content.text">{{ content.text }}</p>
            <template v-if="content.ansi">
                <Ansi :content="content.ansi" />
            </template>
        </div>
        <Diff v-if="content.diff" :content="content.diff" />
        <h4 v-if="trace && trace.length" class="text-muted">
            {{ 'Exception|Exceptions' | plural(trace.length) }}
            <small class="float-right">
                <button type="button" class="btn-link more-actions" title="Reverse order" @click.prevent="reverse = !reverse">
                    <Icon symbol="arrow-down" /><Icon symbol="arrow-up" />
                </button>
            </small>
        </h4>
        <Trace
            v-if="trace && trace.length"
            :context="context"
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
import _cloneDeep from 'lodash/cloneDeep'
import _isArray from 'lodash/isArray'
import _reverse from 'lodash/reverse'
import Ansi from '@/components/Ansi'
import Diff from '@/components/Diff'
import MetaTable from '@/components/MetaTable'
import Trace from '@/components/Trace'

export default {
    name: 'Feedback',
    components: {
        Ansi,
        Diff,
        MetaTable,
        Trace
    },
    props: {
        context: {
            type: Array,
            required: true
        },
        content: {
            type: Object,
            default () {
                return {}
            }
        }
    },
    data () {
        return {
            reverse: false
        }
    },
    computed: {
        trace () {
            if (!this.reverse) {
                return this.content.trace
            }

            let trace = _cloneDeep(this.content.trace)
            trace = trace.map(t => {
                if (_isArray(t)) {
                    _reverse(t)
                }
                return t
            })
            _reverse(trace)
            return trace
        }
    }
}
</script>
