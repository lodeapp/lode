<template>
    <header class="titlebar">
        <div class="titlebar-drag"></div>
        <ul class="titlebar-menu">
            <li v-for="item in $root.menu" :key="item">
                <button
                    type="button"
                    @mousedown="onMenuClick(item, $event)"
                >{{ label(item) }}</button>
            </li>
        </ul>
        <div class="controls">
            <div class="control control-min" @click="minimize">
                <button type="button">
                    <svg aria-hidden="true" version="1.1" width="10" height="10">
                        <path d="M 0,5 10,5 10,6 0,6 Z" />
                    </svg>
                </button>
            </div>
            <div class="control control-max" @click="maximize">
                <button type="button">
                    <svg aria-hidden="true" version="1.1" width="10" height="10">
                        <path d="M 0,0 0,10 10,10 10,0 Z M 1,1 9,1 9,9 1,9 Z" />
                    </svg>
                </button>
            </div>
            <div class="control control-restore" @click="restore">
                <button type="button">
                    <svg aria-hidden="true" version="1.1" width="10" height="10">
                        <path d="m 2,1e-5 0,2 -2,0 0,8 8,0 0,-2 2,0 0,-8 z m 1,1 6,0 0,6 -1,0 0,-5 -5,0 z m -2,2 6,0 0,6 -6,0 z" />
                    </svg>
                </button>
            </div>
            <div class="control control-close" @click="close">
                <button type="button">
                    <svg aria-hidden="true" version="1.1" width="10" height="10">
                        <path d="M 0,0 0,0.7 4.3,5 0,9.3 0,10 0.7,10 5,5.7 9.3,10 10,10 10,9.3 5.7,5 10,0.7 10,0 9.3,0 5,4.3 0.7,0 Z" />
                    </svg>
                </button>
            </div>
        </div>
    </header>
    <div v-if="active" class="titlebar-backdrop"></div>
</template>

<script>
export default {
    data () {
        return {
            active: false
        }
    },
    created () {
        Lode.ipc.on('titlebar-menu-closed', (event, item) => {
            document.body.classList.remove('titlebar-active')
            setTimeout(() => {
                if (this.active === item) {
                    this.active = false
                }
            }, 100)
        })
    },
    methods: {
        minimize () {
            Lode.ipc.send('minimize')
        },
        maximize () {
            Lode.ipc.send('maximize')
        },
        restore () {
            Lode.ipc.send('maximize')
        },
        close () {
            Lode.ipc.send('close')
        },
        label (item) {
            return item.replace(/(&)(\w+)/, '$2')
        },
        onMenuClick (item, event) {
            if (this.active === item) {
                return
            }
            this.active = item
            document.body.classList.add('titlebar-active')
            Lode.ipc.invoke('titlebar-menu', item, JSON.parse(JSON.stringify(event.target.getBoundingClientRect())))
        }
    }
}
</script>
