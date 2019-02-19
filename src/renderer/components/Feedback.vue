<template>
    <div class="feedback">
        <h4>{{ content.title }}</h4>
        <p class="message">{{ content.message }}</p>
        <Diff v-if="content.diff" :diff="content.diff" />
        <Trace v-if="content.trace" :trace="content.trace" />
        <div class="meta-group" v-if="content.meta">
            <div v-for="(meta, index) in content.meta" :key="index">
                <h4 class="text-muted">{{ index.replace(/_/g, ' ') }}</h4>
                <MetaTable :object="meta" />
            </div>
        </div>
    </div>
</template>

<script>
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
        content: {
            type: Object,
            default () {
                return {}
            }
        }
    },
    created () {
        console.log(this.content.meta)
    }
}
</script>
