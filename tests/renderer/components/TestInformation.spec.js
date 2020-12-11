import { createLocalVue, shallowMount } from '@vue/test-utils'
import TestInformation from '@/components/TestInformation'
import Strings from '@/plugins/strings'

const localVue = createLocalVue()
localVue.use(new Strings())

const RealDate = Date.now
beforeAll(() => {
    global.Date.now = jest.fn(() => new Date('2020-12-01T14:49:00').getTime())
})
afterAll(() => {
    global.Date.now = RealDate
})

describe('components/TestInformation.vue', () => {
    test.each([
        ['never run', {
            first: '1985-10-21T09:00:00'
        }],
        ['dates only', {
            first: '1985-10-21T09:00:00',
            last: '2015-10-21T13:00:00'
        }],
        ['with duration', {
            first: '2020-09-10T13:00:00',
            last: '2020-11-21T13:00:00',
            duration: 1000
        }],
        ['with long duration', {
            first: '2020-12-01T10:20:00',
            last: '2020-12-01T14:47:00',
            duration: 32198
        }],
        ['with assertions', {
            first: '2020-11-21T13:00:00',
            last: '2020-12-01T14:48:33',
            assertions: 42
        }]
    ])('matches snapshot for stats: "%s"', async (name, stats) => {
        const wrapper = shallowMount(TestInformation, {
            localVue,
            propsData: {
                stats
            }
        })
        expect(wrapper.html()).toMatchSnapshot()
    })
})
