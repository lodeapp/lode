<template>
    <div class="repository">
        <div v-for="framework in frameworks" :key="framework.id">
            <Framework :framework="framework" />
        </div>
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
            frameworks: []
        }
    },
    created () {
        // @TODO: Get parameters from config
        this.addFramework(new Jest({
            command: 'yarn tests',
            path: this.repository.path,
            runner: 'yarn'
        }))

        this.addFramework(new PHPUnit({
            command: 'depot test',
            path: this.repository.path,
            vmPath: '/aml'
        }))
    },
    methods: {
        addFramework (framework) {
            this.frameworks.push(framework)
        }
    }
}
</script>
