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
                        <Icon symbol="repo" />aqid
                    </span>
                </h2>
                <div class="float-right">
                    <!-- <button class="btn btn-sm">
                        <Icon symbol="sync" />
                    </button> -->
                    <button class="btn btn-sm btn-primary">
                        Run
                        <span class="Counter">2</span>
                    </button>
                    <button class="btn btn-sm btn-danger">Stop</button>
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
        }
    }
}
</script>
