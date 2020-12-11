<template>
    <div class="release">
        <h3 :id="release.version" class="d-flex flex-items-center mb-3" :class="{ 'is-beta': isBeta }">
            <span class="version">{{ release.version }}</span><span v-if="isBeta" class="beta-marker">Beta</span>
            <span class="f2-light date">{{ date }}</span>
            <a class="release-anchor" :href="`#${release.version}`">#</a>
        </h3>
        <div class="notes">
            <div v-for="(notes, group) in release.notes">
                <p v-if="!notes || !notes.length" v-markdown>{{ group }}</p>
                <ul v-else>
                    <li v-for="note in notes" class="d-flex flex-items-start" :class="[group.toLowerCase()]">
                        <Badge :text="group" />
                        <span v-markdown>{{ parseNote(note) }}</span>
                    </li>
                </ul>
            </div>
        </div>
        <div class="seam"></div>
    </div>
</template>

<script>
import moment from 'moment'

export default {
    props: {
        release: {
            type: Object,
            required: true
        }
    },
    computed: {
        isBeta () {
            return this.release.version.match(/^0\./)
        },
        date () {
            return moment(this.release.date).format('Do MMMM YYYY')
        }
    },
    methods: {
        parseNote (note) {
            return note.replace(/\#(\d+)/gm, '[#$1](https://github.com/lodeapp/lode/issues/$1)')
        }
    }
}
</script>
