<template>
    <div
        class="sidebar-item sidebar-item--framework has-status"
        :class="[
            `status--${status}`,
            isActive ? 'is-active' : ''
        ]"
    >
        <div
            class="header"
            @mousedown="activate"
            @contextmenu="onContextMenu"
        >
            <div class="title">
                <Indicator :status="status" />
                <h4 class="heading">
                    <span class="name" :title="model.name">
                        {{ model.name }}
                    </span>
                </h4>
            </div>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Indicator from '@/components/Indicator'
import HasFrameworkMenu from '@/components/mixins/HasFrameworkMenu'

export default {
    name: 'SidebarFramework',
    components: {
        Indicator
    },
    mixins: [
        HasFrameworkMenu
    ],
    props: {
        model: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            status: this.model.status || 'idle'
        }
    },
    computed: {
        isActive () {
            return this.active === this.model.id
        },
        ...mapGetters({
            active: 'context/active'
        })
    },
    mounted () {
        Lode.ipc
            .on(`${this.model.id}:status:sidebar`, this.statusListener)
            .on(`${this.model.id}:error`, this.onErrorEvent)
    },
    beforeDestroy () {
        Lode.ipc
            .removeAllListeners(`${this.model.id}:status:sidebar`)
            .removeAllListeners(`${this.model.id}:error`)
    },
    methods: {
        statusListener (event, payload) {
            this.$payload(payload, (to, from) => {
                this.status = to
            })
        },
        onErrorEvent (event, payload) {
            this.$payload(payload, (message, help) => {
                this.$alert.show({
                    type: 'error',
                    message: this.$string.set('The process for **:0** terminated unexpectedly.', this.model.name),
                    help
                })
            })
        },
        activate () {
            if (!this.isActive) {
                this.$emit('activate', this.model.id)
            }
        }
    }
}
</script>
