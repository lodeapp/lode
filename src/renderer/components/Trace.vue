<template>
    <div class="trace collapsible-group">
        <Collapsible v-for="(item, index) in trace" :key="$string.from({ item, r: $string.random() })" :show="!index">
            <template v-slot:header>
                <template v-if="typeof item === 'object'">
                    {{ item.file }}
                </template>
                <template v-else>
                    {{ item }}
                </template>
            </template>
            <template v-if="typeof item === 'object'">
                <Snippet :snippet="item.snippet" :line="item.line" language="php" />
            </template>
        </Collapsible>
    </div>
</template>

<script>
import Collapsible from '@/components/Collapsible'
import Snippet from '@/components/Snippet'

export default {
    name: 'Trace',
    components: {
        Collapsible,
        Snippet
    },
    props: {
        trace: {
            type: Array,
            required: true
        }
    }
}
</script>
