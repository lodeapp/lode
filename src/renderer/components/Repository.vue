<template>
    <div class="repository">
        <div v-for="framework in repository.frameworks" :key="framework.id">
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
    created () {
        // @TODO: Get parameters from config
        this.repository.addFramework(new Jest({
            command: 'yarn tests',
            path: this.repository.path,
            runner: 'yarn'
        }))

        this.repository.addFramework(new PHPUnit({
            command: 'depot test',
            path: this.repository.path,
            vmPath: '/aml/tests'
        }))
    }
}
</script>
