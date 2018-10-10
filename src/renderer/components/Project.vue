<template>
    <div class="project" :class="{ selective }">
        <div v-for="repository in project.repositories" :key="repository.path">
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
    props: {
        project: {
            type: Object,
            required: true
        }
    },
    computed: {
        ...mapGetters({
            selective: 'tree/selective'
        })
    },
    created () {
        this.project.addRepository('/Users/tomasbuteler/Sites/Amiqus/aqid')
    }
}
</script>
