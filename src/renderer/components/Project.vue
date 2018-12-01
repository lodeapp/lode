<template>
    <div class="project">
        <Repository
            v-for="repository in project.repositories"
            :repository="repository"
            :key="repository.id"
        />
    </div>
</template>

<script>
import { mapGetters } from 'vuex'
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
    computed: {
        ...mapGetters({
            settings: 'config/settings'
        })
    },
    created () {
        const repositories = this.settings('repositories')
        repositories.filter(repository => repository.project === this.project.id).forEach(repository => {
            this.project.addRepository(repository.path, repository.id)
        })
    }
}
</script>
