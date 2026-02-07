<script>
export default {
    methods: {
        maximize() {
            Lode.ipc.send('maximize')
        },
    },
}
</script>

<template>
    <div class="draggable" @dblclick="maximize"></div>
</template>
