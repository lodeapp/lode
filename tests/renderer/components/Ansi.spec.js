// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Ansi from '@/components/Ansi.vue'
import { useThemeStore } from '@/stores'

globalThis.Lode = {
    copyToClipboard: vi.fn(),
}

beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
})

describe('ansi component', () => {
    it('does not render when content is empty', () => {
        const wrapper = shallowMount(Ansi, {
            props: { content: '' },
        })
        expect(wrapper.find('.ansi').exists()).toBe(false)
    })

    it('renders container when content is provided', () => {
        const wrapper = shallowMount(Ansi, {
            props: { content: 'Hello world' },
        })
        expect(wrapper.find('.ansi').exists()).toBe(true)
    })

    it('starts in loading state', () => {
        const wrapper = shallowMount(Ansi, {
            props: { content: 'Hello world' },
        })
        expect(wrapper.find('.ansi').classes()).toContain('is-loading')
        expect(wrapper.find('.loading').exists()).toBe(true)
    })

    it('shows copy and raw toggle buttons', () => {
        const wrapper = shallowMount(Ansi, {
            props: { content: 'Hello world' },
        })
        const buttons = wrapper.findAll('button')
        expect(buttons).toHaveLength(2)
        expect(buttons[0].attributes('title')).toBe('Copy to clipboard')
        expect(buttons[1].attributes('title')).toBe('Show raw output')
    })

    it('calculates rows and cols from content', () => {
        const content = 'line one\nline two longer\nthree'
        const wrapper = shallowMount(Ansi, {
            props: { content },
        })
        expect(wrapper.vm.rows).toBe(3)
        expect(wrapper.vm.cols).toBe('line two longer'.length)
    })

    it('handles single-line content', () => {
        const wrapper = shallowMount(Ansi, {
            props: { content: 'single line' },
        })
        expect(wrapper.vm.rows).toBe(1)
        expect(wrapper.vm.cols).toBe('single line'.length)
    })

    it('handles content with carriage returns', () => {
        const content = 'line one\r\nline two\rline three'
        const wrapper = shallowMount(Ansi, {
            props: { content },
        })
        expect(wrapper.vm.rows).toBe(3)
    })

    it('toggles between parsed and raw views', async () => {
        const wrapper = shallowMount(Ansi, {
            props: { content: 'Hello world' },
        })

        // Force out of loading state
        await wrapper.setData({ loading: false, html: '<span>Hello</span>' })

        expect(wrapper.find('.parsed').exists()).toBe(true)
        expect(wrapper.find('pre').exists()).toBe(false)

        // Toggle to raw
        await wrapper.find('button[title="Show raw output"]').trigger('click')
        expect(wrapper.find('pre').exists()).toBe(true)
        expect(wrapper.find('.parsed').exists()).toBe(false)
        expect(wrapper.find('pre').text()).toBe('Hello world')

        // Toggle back
        await wrapper.find('button[title="Show raw output"]').trigger('click')
        expect(wrapper.find('.parsed').exists()).toBe(true)
        expect(wrapper.find('pre').exists()).toBe(false)
    })

    it('copies parsed text to clipboard', async () => {
        const wrapper = shallowMount(Ansi, {
            props: { content: 'Hello world' },
        })
        await wrapper.setData({ loading: false, html: '<span>Hello world</span>' })

        // In raw mode, copies trimmed content
        await wrapper.setData({ showRaw: true })
        await wrapper.find('button[title="Copy to clipboard"]').trigger('click')
        expect(Lode.copyToClipboard).toHaveBeenCalledWith('Hello world')
    })

    it('copies raw content when in raw mode', async () => {
        const content = '  padded content  '
        const wrapper = shallowMount(Ansi, {
            props: { content },
        })
        await wrapper.setData({ loading: false, showRaw: true })

        await wrapper.find('button[title="Copy to clipboard"]').trigger('click')
        expect(Lode.copyToClipboard).toHaveBeenCalledWith('padded content')
    })

    it('renders serialized HTML in parsed view', async () => {
        const wrapper = shallowMount(Ansi, {
            props: { content: 'test' },
        })
        const testHtml = '<span style="color:#e06c75">red text</span>'
        await wrapper.setData({ loading: false, html: testHtml })

        const parsed = wrapper.find('.parsed')
        expect(parsed.exists()).toBe(true)
        expect(parsed.html()).toContain('color:#e06c75')
        expect(parsed.html()).toContain('red text')
    })

    it('re-renders when theme colors change', async () => {
        const themeStore = useThemeStore()
        themeStore.setTheme('light')

        const wrapper = shallowMount(Ansi, {
            props: { content: 'Hello' },
        })

        const setHtmlSpy = vi.spyOn(wrapper.vm, 'setHtml')

        // Change theme
        themeStore.setTheme('dark')
        await wrapper.vm.$nextTick()

        expect(setHtmlSpy).toHaveBeenCalled()
    })
})
