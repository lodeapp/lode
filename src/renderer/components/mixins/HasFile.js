import * as Path from 'path'
import _get from 'lodash/get'
import Filename from '@/components/Filename'
import { Menu } from '@main/menu'

export default {
    components: {
        Filename
    },
    props: {
        context: {
            type: Array,
            required: true
        }
    },
    data () {
        return {
            activeContextMenu: null
        }
    },
    computed: {
        repository () {
            return _get(this.context, 0)
        },
        framework () {
            return _get(this.context, 1)
        }
    },
    methods: {
        toRelative (path) {
            if (!this.framework || !this.repository || !path.startsWith('/')) {
                return path
            }
            const root = this.framework.runsInRemote ? this.framework.remotePath : this.repository.getPath()
            if (!root) {
                return path
            }
            return Path.relative(root, path)
        },
        onContextMenu (item, index, event) {
            if (typeof item !== 'object') {
                return
            }

            // Calculate the local file path.
            const filePath = Path.join(this.repository.getPath(), this.toRelative(item.file))

            new Menu()
                .add({
                    id: 'reveal',
                    label: __DARWIN__
                        ? 'Reveal in Finder'
                        : __WIN32__
                            ? 'Show in Explorer'
                            : 'Show in your File Manager',
                    click: () => {
                        this.$root.revealFile(filePath)
                    },
                    enabled: this.$fileystem.exists(filePath)
                })
                .add({
                    id: 'copy',
                    label: __DARWIN__
                        ? 'Copy File Path'
                        : 'Copy file path',
                    click: () => {
                        this.$root.copyToClipboard(filePath)
                    },
                    enabled: this.$fileystem.exists(filePath)
                })
                .add({
                    id: 'open',
                    label: __DARWIN__
                        ? 'Open with Default Program'
                        : 'Open with default program',
                    click: () => {
                        this.$root.openFile(filePath)
                    },
                    enabled: this.$fileystem.isSafe(filePath) && this.$fileystem.exists(filePath)
                })
                .before(() => {
                    this.activeContextMenu = index
                })
                .after(() => {
                    this.activeContextMenu = null
                })
                .open()
        },
        hasContextMenu (index) {
            return this.activeContextMenu === index
        }
    }
}
