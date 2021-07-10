<template>
    <header class="titlebar">
        <div class="titlebar-drag"></div>
        <ul class="titlebar-menu">
            <li v-for="item in $root.menu" :key="item">{{ item }}</li>
        </ul>
        <div class="controls">
            <div class="control control-min" @click="minimize">
                <img srcset="static/icons/system/min-k-10.png 1x, static/icons/system/min-k-12.png 1.25x, static/icons/system/min-k-15.png 1.5x, static/icons/system/min-k-15.png 1.75x, static/icons/system/min-k-20.png 2x, static/icons/system/min-k-20.png 2.25x, static/icons/system/min-k-24.png 2.5x, static/icons/system/min-k-30.png 3x, static/icons/system/min-k-30.png 3.5x" draggable="false">
            </div>
            <div class="control control-max" @click="maximize">
                <img srcset="static/icons/system/max-k-10.png 1x, static/icons/system/max-k-12.png 1.25x, static/icons/system/max-k-15.png 1.5x, static/icons/system/max-k-15.png 1.75x, static/icons/system/max-k-20.png 2x, static/icons/system/max-k-20.png 2.25x, static/icons/system/max-k-24.png 2.5x, static/icons/system/max-k-30.png 3x, static/icons/system/max-k-30.png 3.5x" draggable="false">
            </div>
            <div class="control control-restore" @click="restore">
                <img srcset="static/icons/system/restore-k-10.png 1x, static/icons/system/restore-k-12.png 1.25x, static/icons/system/restore-k-15.png 1.5x, static/icons/system/restore-k-15.png 1.75x, static/icons/system/restore-k-20.png 2x, static/icons/system/restore-k-20.png 2.25x, static/icons/system/restore-k-24.png 2.5x, static/icons/system/restore-k-30.png 3x, static/icons/system/restore-k-30.png 3.5x" draggable="false">
            </div>
            <div class="control control-close" @click="close">
                <img srcset="static/icons/system/close-k-10.png 1x, static/icons/system/close-k-12.png 1.25x, static/icons/system/close-k-15.png 1.5x, static/icons/system/close-k-15.png 1.75x, static/icons/system/close-k-20.png 2x, static/icons/system/close-k-20.png 2.25x, static/icons/system/close-k-24.png 2.5x, static/icons/system/close-k-30.png 3x, static/icons/system/close-k-30.png 3.5x" draggable="false">
            </div>
        </div>
    </header>
</template>

<script>
export default {
    methods: {
        minimize () {
            console.log('MINIMIZING')
        },
        maximize () {
            console.log('MAXIMIZING')
        },
        restore () {
            console.log('RESTORING')
        },
        close () {
            console.log('CLOSING')
        }
    }
}
</script>
