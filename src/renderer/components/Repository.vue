<template>
    <div
        class="repository parent"
        :class="[
            `status--${repository.status}`,
            `is-${expandStatus}`,
        ]"
    >
        <div class="header">
            <div class="title">
                <div class="status tooltipped tooltipped-se tooltipped-align-left-1" :aria-label="displayStatus(repository.status)">
                    <span class="indicator"></span>
                </div>
                <h2 class="heading">
                    <span class="toggle" @click="toggle">
                        <Icon :symbol="show ? 'chevron-down' : 'chevron-right'" />
                    </span>
                    <span class="repository-name">
                        <Icon symbol="repo" />{{ repository.name }}
                    </span>
                </h2>
                <div class="float-right">
                    <!-- <button class="btn btn-sm">
                        <Icon symbol="sync" />
                    </button> -->
                    <button
                        class="btn btn-sm btn-primary"
                        :disabled="!repository.frameworks.length || running || refreshing"
                        @click="run"
                    >
                        Run
                        <span v-if="repository.frameworks.length > 1" class="Counter">{{ repository.frameworks.length }}</span>
                    </button>
                    <button
                        class="btn btn-sm btn-danger"
                        :disabled="!repository.frameworks.length || !running && !refreshing"
                        @click="stop"
                    >
                        Stop
                    </button>
                </div>
            </div>
        </div>
        <Framework
            v-show="show"
            v-for="framework in repository.frameworks"
            :key="framework.id"
            :framework="framework"
            @change="storeState"
        />
    </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import Framework from '@/components/Framework'

export default {
    name: 'Repository',
    components: {
        Framework
    },
    props: {
        repository: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            show: true
        }
    },
    computed: {
        running () {
            return this.repository.status === 'running'
        },
        refreshing () {
            return this.repository.status === 'refreshing'
        },
        expandStatus () {
            return this.show ? 'expanded' : 'collapsed'
        },
        ...mapGetters({
            storedFrameworks: 'config/frameworks',
            displayStatus: 'status/display'
        })
    },
    created () {
        this.storedFrameworks(this.repository.id).forEach(framework => {
            this.repository.addFramework(framework)
        })
    },
    methods: {
        toggle () {
            this.show = !this.show
        },
        run () {
            this.repository.frameworks.forEach(framework => {
                this.$queue.add(framework.queueStart())
            })
        },
        stop () {
            this.repository.frameworks.forEach(framework => {
                framework.stop()
            })
        },
        storeState (framework) {
            this.frameworkChange({ repositoryId: this.repository.id, framework })
        },
        ...mapActions({
            frameworkChange: 'config/frameworkChange'
        })
    }
}
</script>
