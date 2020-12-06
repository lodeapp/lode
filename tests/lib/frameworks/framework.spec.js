import flushPromises from 'flush-promises'
import { ApplicationWindow } from '@main/application-window'
import { Framework } from '@lib/frameworks/framework'
import { Suite } from '@lib/frameworks/suite'

jest.mock('@lib/state')
jest.mock('electron-store')
jest.mock('@main/application-window')
jest.mock('@lib/process/queue')

beforeAll(() => {
    // Capture calls to the global logger and suppress console logs.
    global.log = {
        debug () {},
        info () {},
        warn () {},
        error () {}
    }

    global.__WIN32__ = process.platform === 'win32'
    global.__DARWIN__ = process.platform === 'darwin'
    global.__LINUX__ = process.platform === 'linux'
})

describe('lib/frameworks/framework', () => {
    const options = {
        name: 'Hobnobs',
        type: 'biscuit',
        command: '  ./bake   ',
        path: '/tests',
        repositoryPath: '/mcvities/hobnobs/',
        suites: [
            {
                file: '/mcvities/hobnobs/isTasty.js',
                testsLoaded: true,
                tests: [
                    {
                        id: '111',
                        name: 'tastes sweet'
                    },
                    {
                        id: '222',
                        name: 'tastes oaty',
                        tests: [
                            {
                                id: '333',
                                name: 'has many oats'
                            },
                            {
                                id: '444',
                                name: 'has jumbo oats'
                            }
                        ]
                    }
                ]
            },
            {
                file: '/mcvities/hobnobs/isNobbly.js',
                testsLoaded: false,
                tests: []
            }
        ]
    }

    it('can instantiate a new generic framework', async () => {
        const framework = new Framework(new ApplicationWindow(), options)

        // Generates new UUID
        expect(framework.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
        expect(framework.getId()).toEqual(framework.id)
        expect(framework.name).toBe('Hobnobs')
        expect(framework.getDisplayName()).toBe(framework.name)
        expect(framework.type).toBe('biscuit')
        // Trims command
        expect(framework.command).toBe('./bake')
        // Trims leading forward slashes from tests path
        expect(framework.path).toBe('tests')
        expect(framework.repositoryPath).toBe('/mcvities/hobnobs/')
        expect(framework.fullPath).toBe(
            __WIN32__
                ? '\\mcvities\\hobnobs\\tests'
                : '/mcvities/hobnobs/tests'
        )
        expect(framework.runsInRemote).toBe(false)
        expect(framework.remotePath).toBe('')
        expect(framework.getRemotePath()).toBe('')
        expect(framework.getFullRemotePath()).toBe('')
        expect(framework.sshHost).toBe('')
        expect(framework.sshUser).toBe(null)
        expect(framework.sshPort).toBe(null)
        expect(framework.sshIdentity).toBe(null)
        expect(framework.runner).toBe('')
        // Defaults to sorting by name, unless overridden by specific framework
        expect(framework.sort).toBe('name')
        // Can't toggle tests, unless overridden by specific framework
        expect(framework.canToggleTests).toBe(false)
        expect(framework.proprietary).toEqual({})
        expect(framework.hasSuites).toBe(true)
        expect(framework.initialSuiteCount).toBe(2)
        expect(framework.initialSuiteReady).toBe(0)
        // Status is 'loading' until suites have finished loading
        expect(framework.status).toBe('loading')
        expect(framework.ready).toBe(false)

        await flushPromises()

        expect(framework.ready).toBe(true)
        expect(framework.selective).toBe(false)
        expect(framework.selected).toEqual({
            suites: []
        })
        framework.suites.forEach(suite => {
            expect(suite).toBeInstanceOf(Suite)
        })
        expect(framework.count()).toBe(2)
        expect(framework.empty()).toBe(false)
    })

    it('can instantiate a new generic framework running remotely', async () => {
        const framework = new Framework(new ApplicationWindow(), {
            ...options,
            runsInRemote: true,
            remotePath: '/var/www/'
        })

        expect(framework.command).toBe('./bake')
        expect(framework.path).toBe('tests')
        expect(framework.repositoryPath).toBe('/mcvities/hobnobs/')
        expect(framework.fullPath).toBe(
            __WIN32__
                ? '\\mcvities\\hobnobs\\tests'
                : '/mcvities/hobnobs/tests'
        )
        expect(framework.runsInRemote).toBe(true)
        expect(framework.remotePath).toBe('/var/www/')
        expect(framework.getRemotePath()).toBe('/var/www/')
        expect(framework.getFullRemotePath()).toBe('/var/www/tests')
    })

    it('sorts suites by name by default', async () => {
        const framework = new Framework(new ApplicationWindow(), options)
        await flushPromises()

        // Public access to suites is sorted by name, regardless of how they
        // were registered in the framework originally.
        expect(framework.getAllSuites()[0].getId()).toBe('/mcvities/hobnobs/isNobbly.js')
        expect(framework.getAllSuites()[1].getId()).toBe('/mcvities/hobnobs/isTasty.js')
    })

    it('can format a framework to use in the renderer process', async () => {
        const framework = new Framework(new ApplicationWindow(), options)
        await flushPromises()
        expect(framework.initialSuiteReady).toBe(2)
        expect(framework.render()).toMatchSnapshot({
            id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
        })
    })

    it('can persist a framework in a store', async () => {
        const framework = new Framework(new ApplicationWindow(), options)
        await flushPromises()
        expect(framework.initialSuiteReady).toBe(2)
        expect(framework.persist()).toMatchSnapshot({
            id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
        })
    })

    it('stores statuses centrally', async () => {
        const framework = new Framework(new ApplicationWindow(), options)
        await flushPromises()
        expect(framework.getStatusMap()).toEqual({
            '111': 'idle',
            '222': 'idle',
            '333': 'idle',
            '444': 'idle',
            '/mcvities/hobnobs/isTasty.js': 'idle',
            '/mcvities/hobnobs/isNobbly.js': 'idle'
        })

        expect(framework.getNuggetStatus('111')).toBe('idle')
        // Non-existent nuggets default to 'idle'
        expect(framework.getNuggetStatus('999')).toBe('idle')
    })

    it('stores a central status ledger', async () => {
        const framework = new Framework(new ApplicationWindow(), options)
        await flushPromises()
        expect(framework.getLedger()).toEqual({
            queued: 0,
            running: 0,
            passed: 0,
            failed: 0,
            incomplete: 0,
            skipped: 0,
            warning: 0,
            partial: 0,
            empty: 0,
            idle: 2,
            error: 0
        })
    })

    it('can determine framework business', async () => {
        const framework = new Framework(new ApplicationWindow(), options)
        await flushPromises()
        expect(framework.isBusy()).toBe(false)
        expect(framework.isRunning()).toBe(false)
        expect(framework.isRefreshing()).toBe(false)

        framework.status = 'running'
        expect(framework.isBusy()).toBe(true)
        expect(framework.isRunning()).toBe(true)
        expect(framework.isRefreshing()).toBe(false)

        framework.status = 'refreshing'
        expect(framework.isBusy()).toBe(true)
        expect(framework.isRunning()).toBe(false)
        expect(framework.isRefreshing()).toBe(true)

        framework.status = 'queued'
        expect(framework.isBusy()).toBe(true)
        expect(framework.isRunning()).toBe(false)
        expect(framework.isRefreshing()).toBe(false)
    })

    it('can update nugget statuses', async () => {
        const framework = new Framework(new ApplicationWindow(), options)
        await flushPromises()

        framework.emitLedgerToRenderer = jest.fn()

        framework.setNuggetStatus('111', 'queued', 'idle', false)
        expect(framework.getNuggetStatus('111')).toBe('queued')
        // Ledger is emitted, but statuses are only updated if explicitly requested
        expect(framework.emitLedgerToRenderer).toHaveBeenCalled()
        expect(framework.getLedger().idle).toBe(2)
        expect(framework.getLedger().queued).toBe(0)

        framework.setNuggetStatus('/mcvities/hobnobs/isTasty.js', 'queued', 'idle', true)
        expect(framework.getNuggetStatus('/mcvities/hobnobs/isTasty.js')).toBe('queued')
        expect(framework.emitLedgerToRenderer).toHaveBeenCalledTimes(2)
        expect(framework.getLedger().idle).toBe(1)
        expect(framework.getLedger().queued).toBe(1)
    })

    it('can refresh framework', async () => {
        const framework = new Framework(new ApplicationWindow(), options)
        await flushPromises()

        // Set an arbitrary status to ensure they are kept after refresh
        framework.setNuggetStatus('/mcvities/hobnobs/isTasty.js', 'passed', 'idle', true)

        // Refreshing should queue the job before running
        framework.refresh()
        expect(framework.status).toBe('queued')
        expect(framework.getNuggetStatus('/mcvities/hobnobs/isTasty.js')).toBe('passed')
        expect(Object.values(framework.queue).length).toBe(1)
        expect(Object.values(framework.queue)[0]).toBeInstanceOf(Function)
        expect(framework.isBusy()).toBe(true)

        // Mock the reload method, which will only exist on framework implementations (e.g. Jest)
        framework.reload = jest.fn(() => {
            // Only mark one suite as fresh, so second should be considered stale and removed
            framework.getAllSuites()
                .filter(suite => suite.getId() === '/mcvities/hobnobs/isTasty.js')
                .forEach(suite => suite.setFresh(true))

            return Promise.resolve()
        })

        // Run queued refresh
        Object.values(framework.queue)[0]()
        await flushPromises()

        expect(framework.reload).toHaveBeenCalledTimes(1)
        expect(framework.isBusy()).toBe(false)
        expect(framework.getAllSuites().length).toBe(1)
        expect(framework.getAllSuites()[0].getId()).toBe('/mcvities/hobnobs/isTasty.js')
        expect(framework.getNuggetStatus('/mcvities/hobnobs/isTasty.js')).toBe('passed')
        // Framework now only has one suite, and if its previoys status was kept, it should
        // be passed. Therefore, the framework's status after a refresh is now "passed".
        expect(framework.status).toBe('passed')
    })
})
