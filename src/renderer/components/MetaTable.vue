<template>
    <div class="meta markdown-body">
        <table>
            <colgroup>
                <col width="1%">
                <col width="99%">
            </colgroup>
            <tbody>
                <tr v-for="(value, key) in object" :key="key">
                    <td class="heading" :title="key">{{ key }}</td>
                    <td>{{ value }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
export default {
    name: 'Meta',
    props: {
        object: {
            type: Object,
            required: true
        }
    }
}
</script>
