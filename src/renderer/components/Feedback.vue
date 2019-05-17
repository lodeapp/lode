<template>
    <div class="feedback">
        <h4>{{ content.title }}</h4>
        <p class="message">{{ content.text }}</p>
        <Diff v-if="content.diff" :content="content.diff" />
        <h4 v-if="trace" class="text-muted">
            {{ 'Exception|Exceptions' | plural(trace.length) }}
            <small class="float-right">
                <button type="button" class="btn-link more-actions" title="Reverse order" @click.prevent="reverse = !reverse">
                    <Icon symbol="arrow-down" /><Icon symbol="arrow-up" />
                </button>
            </small>
        </h4>
        <Trace
            v-if="trace"
            :repository="repository"
            :framework="framework"
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
import _get from 'lodash/get'
import _isArray from 'lodash/isArray'
import _reverse from 'lodash/reverse'
import Diff from '@/components/Diff'
import MetaTable from '@/components/MetaTable'
import Trace from '@/components/Trace'

export default {
    name: 'Feedback',
    components: {
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
        repository () {
            return _get(this.context, 0)
        },
        framework () {
            return _get(this.context, 1)
        },
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
