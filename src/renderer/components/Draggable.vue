<template>
    <div class="draggable" @dblclick="maximize"></div>
</template>

<script>
export default {
    methods: {
        maximize () {
            Lode.ipc.send('maximize')
        }
    }
}
</script>
