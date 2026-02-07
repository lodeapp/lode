import * as Path from 'node:path'
import { mapState } from 'pinia'
import { useContextStore } from '@/stores/context'
import Filename from '@/components/Filename.vue'

export default {
    components: {
        Filename,
    },
    data() {
        return {
            activeContextMenu: null,
        }
    },
    computed: {
        ...mapState(useContextStore, ['rootPath', 'repositoryPath']),
    },
    methods: {
        relativePath(path) {
            if (!this.rootPath || !path.startsWith('/')) {
                return path
            }

            return Path.relative(this.rootPath, path)
        },
        absoluteLocalPath(file) {
            return Path.join(this.repositoryPath, this.relativePath(file))
        },
        onContextMenu(file, index) {
            this.activeContextMenu = index
            Lode.ipc.invoke('file-context-menu', this.absoluteLocalPath(file)).finally(() => {
                this.activeContextMenu = null
            })
        },
        hasContextMenu(index) {
            return this.activeContextMenu === index
        },
    },
}
