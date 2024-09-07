import * as Path from 'path'
import { mapGetters } from 'vuex'
import Filename from '@/components/Filename.vue'

export default {
    components: {
        Filename
    },
    data () {
        return {
            activeContextMenu: null
        }
    },
    computed: {
        ...mapGetters({
            rootPath: 'context/rootPath',
            repositoryPath: 'context/repositoryPath'
        })
    },
    methods: {
        relativePath (path) {
            return path

            // @TODO: figure out why path doesn't work (i.e. is `undefined`)
            // if (!this.rootPath || !path.startsWith('/')) {
            //     return path
            // }

            // return Path.relative(this.rootPath, path)
        },
        absoluteLocalPath (file) {
            return Path.join(this.repositoryPath, this.relativePath(file))
        },
        onContextMenu (file, index) {
            this.activeContextMenu = index
            Lode.ipc.invoke('file-context-menu', this.absoluteLocalPath(file)).finally(() => {
                this.activeContextMenu = null
            })
        },
        hasContextMenu (index) {
            return this.activeContextMenu === index
        }
    }
}
