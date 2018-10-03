<template>
    <div class="project" :class="{ selective }">
        <div v-for="repository in repositories" :key="repository.path">
            <Repository :repository="repository" />
        </div>
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
    data () {
        return {
            repositories: []
        }
    },
    computed: {
        ...mapGetters({
            selective: 'tree/selective'
        })
    },
    created () {
        this.addRepository({
            path: '/Users/tomasbuteler/Sites/Amiqus/aqid'
        })
    },
    methods: {
        addRepository (repository) {
            this.repositories.push(repository)
        }
    }
}
</script>

<style lang="scss">
    input {
        visibility: hidden;
    }

    .selective {
        input {
            visibility: visible;
        }
    }
</style>
