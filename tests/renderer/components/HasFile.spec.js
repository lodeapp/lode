// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils'
import { createPinia, defineStore, setActivePinia } from 'pinia'
import HasFile from '@/components/mixins/HasFile'

// Minimal component that uses the HasFile mixin
const TestComponent = {
    mixins: [HasFile],
    template: '<div></div>',
}

// Create a mock context store with the same id as the real one
const useContextStore = defineStore('context', {
    state: () => ({
        repository: null,
        framework: null,
    }),
    getters: {
        rootPath: (state) => {
            if (!state.framework || !state.repository) {
                return ''
            }
            return state.framework.runsInRemote ? state.framework.remotePath : state.repository.path
        },
        repositoryPath: (state) => {
            if (!state.repository) {
                return ''
            }
            return state.repository.path
        },
    },
})

beforeEach(() => {
    setActivePinia(createPinia())
})

describe('hasFile mixin', () => {
    describe('relativePath', () => {
        it('returns the path when rootPath is empty', () => {
            const wrapper = shallowMount(TestComponent)
            expect(wrapper.vm.relativePath('/var/www/html/tests/Foo.php')).toBe('/var/www/html/tests/Foo.php')
        })

        it('returns the path when it is falsy', () => {
            const store = useContextStore()
            store.repository = { path: '/home/user/project' }
            store.framework = { runsInRemote: false }
            const wrapper = shallowMount(TestComponent)

            expect(wrapper.vm.relativePath(undefined)).toBe(undefined)
            expect(wrapper.vm.relativePath(null)).toBe(null)
            expect(wrapper.vm.relativePath('')).toBe('')
        })

        it('returns the path when it does not start with /', () => {
            const store = useContextStore()
            store.repository = { path: '/home/user/project' }
            store.framework = { runsInRemote: false }
            const wrapper = shallowMount(TestComponent)

            expect(wrapper.vm.relativePath('relative/path.php')).toBe('relative/path.php')
        })

        it('computes relative path for local frameworks', () => {
            const store = useContextStore()
            store.repository = { path: '/home/user/project' }
            store.framework = { runsInRemote: false }
            const wrapper = shallowMount(TestComponent)

            expect(wrapper.vm.relativePath('/home/user/project/tests/Foo.php')).toBe('tests/Foo.php')
        })

        it('computes relative path for remote frameworks', () => {
            const store = useContextStore()
            store.repository = { path: '/home/user/project' }
            store.framework = { runsInRemote: true, remotePath: '/var/www/html' }
            const wrapper = shallowMount(TestComponent)

            expect(wrapper.vm.relativePath('/var/www/html/tests/Foo.php')).toBe('tests/Foo.php')
        })

        it('does not call process.cwd when rootPath is not absolute', () => {
            const store = useContextStore()
            store.repository = { path: '/home/user/project' }
            store.framework = { runsInRemote: true, remotePath: 'relative' }
            const wrapper = shallowMount(TestComponent)

            // Should return path as-is rather than throwing process.cwd error
            expect(wrapper.vm.relativePath('/var/www/html/tests/Foo.php')).toBe('/var/www/html/tests/Foo.php')
        })
    })
})
