<template>
    <div
        class="repository parent"
        :class="[
            `status--${status}`,
            `is-${expandStatus}`,
        ]"
    >
        <div class="header">
            <div class="title">
                <div class="status">
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
        />
    </div>
</template>

<script>
import { Jest, PHPUnit } from '@lib/frameworks'
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
        status () {
            return this.repository.status
        },
        expandStatus () {
            return this.show ? 'expanded' : 'collapsed'
        }
    },
    created () {
        // @TODO: Get parameters from config
        this.repository.addFramework(new Jest({
            command: 'yarn tests',
            path: `${this.repository.path}/tests/assets/js`,
            runner: 'yarn'
        }))

        this.repository.addFramework(new PHPUnit({
            command: 'depot test',
            path: this.repository.path,
            vmPath: '/aml/tests'
        }))
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
        }
    }
}
</script>
