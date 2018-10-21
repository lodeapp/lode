<template>
    <div class="project">
        <div v-for="repository in project.repositories" :key="repository.path">
            <Repository :repository="repository" />
        </div>
    </div>
</template>

<script>
import Repository from '@/components/Repository'

export default {
    name: 'Project',
    components: {
        Repository
    },
    props: {
        project: {
            type: Object,
            required: true
        }
    },
    created () {
        this.project.addRepository('/Users/tomasbuteler/Sites/Amiqus/aqid')
    }
}
</script>
