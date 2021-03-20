import flushPromises from 'flush-promises'
import { ApplicationWindow } from '@main/application-window'
import { Framework } from '@lib/frameworks/framework'
import { Suite } from '@lib/frameworks/suite'

jest.mock('@lib/state')
jest.mock('electron-store')
jest.mock('@main/application-window')
jest.mock('@lib/process/queue')

jest.useFakeTimers()

const options = {
    name: 'Hobnobs',
    type: 'biscuit',
    command: '  ./bake   ',
    path: '/tests',
    repositoryPath: '/mcvities/hobnobs/',
    suites: [
        {
            file: 'isTasty.js',
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
            file: 'isNobbly.js',
            testsLoaded: false,
            tests: [
                {
                    id: '555',
                    name: 'has lumps'
                }
            ]
        }
    ]
}

describe('Framework manipulation', () => {
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
        expect(framework.getFullRemotePath()).toBe(
            __WIN32__
                ? '\\var\\www\\tests'
                : '/var/www/tests'
        )
    })

    it('sorts suites by name by default', async () => {
        const framework = new Framework(new ApplicationWindow(), options)
        await flushPromises()

        // Public access to suites is sorted by name, regardless of how they
        // were registered in the framework originally.
        expect(framework.getAllSuites()[0].getId()).toBe('isNobbly.js')
        expect(framework.getAllSuites()[1].getId()).toBe('isTasty.js')
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

    it('can update framework options', async () => {
        const framework = new Framework(new ApplicationWindow(), options)
        await flushPromises()

        framework.emit = jest.fn()
        framework.reset = jest.fn()
        framework.resetSuites = jest.fn()
        framework.refresh = jest.fn()

        await framework.updateOptions({
            command: './bake',
            name: 'Digestives',
            runsInRemote: false,
            sshHost: '',
            repositoryPath: '/mcvities/hobnobs/'
        })

        expect(framework.name).toBe('Digestives')
        expect(framework.emit).toHaveBeenLastCalledWith('change', framework)
        expect(framework.reset).not.toHaveBeenCalled()
        expect(framework.resetSuites).not.toHaveBeenCalled()
        expect(framework.refresh).not.toHaveBeenCalled()
    })

    it('rebuilds framework when command changes', async () => {
        const framework = new Framework(new ApplicationWindow(), options)
        await flushPromises()

        framework.emit = jest.fn()
        framework.reset = jest.fn()
        framework.resetSuites = jest.fn()
        framework.refresh = jest.fn()

        await framework.updateOptions({
            command: './eat',
            runsInRemote: false,
            sshHost: '',
            repositoryPath: '/mcvities/hobnobs/'
        })

        expect(framework.emit).toHaveBeenLastCalledWith('change', framework)
        expect(framework.reset).toHaveBeenCalledTimes(1)
        expect(framework.resetSuites).toHaveBeenCalledTimes(1)
        expect(framework.refresh).toHaveBeenCalledTimes(1)
    })

    it('rebuilds framework when remote flag changes', async () => {
        const framework = new Framework(new ApplicationWindow(), options)
        await flushPromises()

        framework.emit = jest.fn()
        framework.reset = jest.fn()
        framework.resetSuites = jest.fn()
        framework.refresh = jest.fn()

        await framework.updateOptions({
            command: './bake',
            runsInRemote: true,
            sshHost: '',
            repositoryPath: '/mcvities/hobnobs/'
        })

        expect(framework.emit).toHaveBeenLastCalledWith('change', framework)
        expect(framework.reset).toHaveBeenCalledTimes(1)
        expect(framework.resetSuites).toHaveBeenCalledTimes(1)
        expect(framework.refresh).toHaveBeenCalledTimes(1)
    })

    it('rebuilds framework when ssh host changes', async () => {
        const framework = new Framework(new ApplicationWindow(), options)
        await flushPromises()

        framework.emit = jest.fn()
        framework.reset = jest.fn()
        framework.resetSuites = jest.fn()
        framework.refresh = jest.fn()

        await framework.updateOptions({
            command: './bake',
            runsInRemote: false,
            sshHost: 'mcvities',
            repositoryPath: '/mcvities/hobnobs/'
        })

        expect(framework.emit).toHaveBeenLastCalledWith('change', framework)
        expect(framework.reset).toHaveBeenCalledTimes(1)
        expect(framework.resetSuites).toHaveBeenCalledTimes(1)
        expect(framework.refresh).toHaveBeenCalledTimes(1)
    })

    it('rebuilds framework when repository path changes', async () => {
        const framework = new Framework(new ApplicationWindow(), options)
        await flushPromises()

        framework.emit = jest.fn()
        framework.reset = jest.fn()
        framework.resetSuites = jest.fn()
        framework.refresh = jest.fn()

        await framework.updateOptions({
            command: './bake',
            runsInRemote: false,
            sshHost: '',
            repositoryPath: '/mcvities/digestives/'
        })

        expect(framework.emit).toHaveBeenLastCalledWith('change', framework)
        expect(framework.reset).toHaveBeenCalledTimes(1)
        expect(framework.resetSuites).toHaveBeenCalledTimes(1)
        expect(framework.refresh).toHaveBeenCalledTimes(1)
    })

    it('can get a suite by its id', async () => {
        const framework = new Framework(new ApplicationWindow(), options)
        await flushPromises()

        expect(framework.getSuiteById('isTasty.js')).toBe(framework.suites[0])
        expect(framework.getSuiteById('isMinty.js')).toBe(undefined)
    })

    it('stores statuses centrally', async () => {
        const framework = new Framework(new ApplicationWindow(), options)
        await flushPromises()
        expect(framework.getStatusMap()).toEqual({
            '111': 'idle',
            '222': 'idle',
            '333': 'idle',
            '444': 'idle',
            '555': 'idle',
            'isTasty.js': 'idle',
            'isNobbly.js': 'idle'
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

    it('can determine framework busyness', async () => {
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

        framework.setNuggetStatus('isTasty.js', 'queued', 'idle', true)
        expect(framework.getNuggetStatus('isTasty.js')).toBe('queued')
        expect(framework.emitLedgerToRenderer).toHaveBeenCalledTimes(2)
        expect(framework.getLedger().idle).toBe(1)
        expect(framework.getLedger().queued).toBe(1)
    })
})

describe('Framework refreshing', () => {
    it('can refresh framework', async () => {
        const framework = new Framework(new ApplicationWindow(), options)
        await flushPromises()

        // Set an arbitrary status to ensure they are kept after refresh
        framework.setNuggetStatus('isTasty.js', 'passed', 'idle', true)

        // Refreshing should queue the job before running
        framework.refresh()
        expect(framework.status).toBe('queued')
        expect(framework.getNuggetStatus('isTasty.js')).toBe('passed')
        expect(Object.values(framework.queue).length).toBe(1)
        expect(Object.values(framework.queue)[0]).toBeInstanceOf(Function)
        expect(framework.isBusy()).toBe(true)

        // Mock framework assembly, with granular control over when
        // assemble method is resolved.
        let assemble
        framework.assemble = jest.fn(() => {
            return new Promise(resolve => {
                assemble = resolve
            })
        })
        framework.disassemble = jest.fn()

        // Mock the reload method, which will only exist on framework implementations (e.g. Jest)
        framework.reload = jest.fn(() => {
            // Only mark one suite as fresh, so second should be considered stale and removed
            framework.getAllSuites()
                .filter(suite => suite.getId() === 'isTasty.js')
                .forEach(suite => suite.setFresh(true))

            return Promise.resolve()
        })

        // Run queued refresh
        Object.values(framework.queue)[0]()

        await assemble()
        expect(framework.status).toBe('refreshing')

        await flushPromises()

        expect(framework.reload).toHaveBeenCalledTimes(1)
        expect(framework.assemble).toHaveBeenCalledTimes(1)
        expect(framework.disassemble).toHaveBeenCalledTimes(1)
        expect(framework.isBusy()).toBe(false)
        expect(framework.getAllSuites().length).toBe(1)
        expect(framework.getAllSuites()[0].getId()).toBe('isTasty.js')
        expect(framework.getNuggetStatus('isTasty.js')).toBe('passed')
        // Framework now only has one suite, and if its previoys status was kept, it should
        // be passed. Therefore, the framework's status after a refresh is now "passed".
        expect(framework.status).toBe('passed')
    })

    it('handles framework interruption when refreshing', async () => {
        const framework = new Framework(new ApplicationWindow(), options)
        await flushPromises()

        // Set an arbitrary status to ensure they are kept after refresh
        framework.setNuggetStatus('isTasty.js', 'passed', 'idle', true)

        // Refreshing should queue the job before running
        framework.refresh()
        framework.assemble = jest.fn()
        framework.disassemble = jest.fn()

        // Mock reload as returning 'killed' string (i.e. interrupted child process).
        framework.reload = jest.fn(() => Promise.resolve('killed'))

        // Run queued refresh
        Object.values(framework.queue)[0]()
        await flushPromises()

        expect(framework.reload).toHaveBeenCalledTimes(1)
        expect(framework.assemble).toHaveBeenCalledTimes(1)
        expect(framework.disassemble).toHaveBeenCalledTimes(1)
        expect(framework.getAllSuites().length).toBe(2)
        expect(framework.getNuggetStatus('isTasty.js')).toBe('passed')
    })

    it('handles framework errors when refreshing', async () => {
        const framework = new Framework(new ApplicationWindow(), options)
        await flushPromises()

        // Set an arbitrary status to ensure they are kept after refresh
        // We'll need to set a consistent status for parent and children,
        // because on error the status of the parent will be parsed again.
        framework.setNuggetStatus('isTasty.js', 'passed', 'idle', true)
        framework.setNuggetStatus('111', 'passed', 'idle', false)
        framework.setNuggetStatus('222', 'passed', 'idle', false)
        framework.setNuggetStatus('333', 'passed', 'idle', false)
        framework.setNuggetStatus('444', 'passed', 'idle', false)

        framework.refresh()
        framework.assemble = jest.fn()
        framework.disassemble = jest.fn()
        framework.emit = jest.fn()
        framework.emitToRenderer = jest.fn()

        // Mock reload as returning a rejected promise
        const error = new Error('Boomtown!')
        framework.reload = jest.fn(() => Promise.reject(error))

        // Trigger queued refresh
        Object.values(framework.queue)[0]()
        await flushPromises()

        expect(framework.reload).toHaveBeenCalledTimes(1)
        expect(framework.assemble).toHaveBeenCalledTimes(1)
        expect(framework.disassemble).toHaveBeenCalledTimes(1)
        expect(framework.getAllSuites().length).toBe(2)
        expect(framework.getNuggetStatus('isTasty.js')).toBe('passed')
        expect(framework.status).toBe('error')

        expect(framework.emit).toHaveBeenCalledWith('error', error)
        expect(framework.emitToRenderer).toHaveBeenLastCalledWith(`${framework.id}:error`, 'Error: Boomtown!', '')

        jest.runAllTimers()
        expect(framework.emitToRenderer).toHaveBeenLastCalledWith(
            `${framework.id}:ledger`,
            {
                queued: 0,
                running: 0,
                passed: 1,
                failed: 0,
                incomplete: 0,
                skipped: 0,
                warning: 0,
                partial: 0,
                empty: 0,
                idle: 1,
                error: 0
            },
            {
                '111': 'passed',
                '222': 'passed',
                '333': 'passed',
                '444': 'passed',
                '555': 'idle',
                'isTasty.js': 'passed',
                'isNobbly.js': 'idle'
            }
        )
    })
})

describe('Framework running', () => {
    it('can run a framework', async () => {
        const framework = new Framework(new ApplicationWindow(), options)
        await flushPromises()

        // Running should queue the job before running
        framework.start()
        expect(framework.status).toBe('queued')
        expect(Object.values(framework.queue).length).toBe(1)
        expect(Object.values(framework.queue)[0]).toBeInstanceOf(Function)
        expect(framework.isBusy()).toBe(true)

        let assemble
        framework.assemble = jest.fn(() => {
            return new Promise(resolve => {
                assemble = resolve
            })
        })
        framework.disassemble = jest.fn()
        framework.emit = jest.fn()
        framework.emitToRenderer = jest.fn()
        framework.reload = jest.fn(() => {
            framework.getAllSuites().forEach(suite => suite.setFresh(true))
            return Promise.resolve()
        })
        framework.runArgs = jest.fn(() => ['hobnobs', 'digestives'])
        framework.runSelectiveArgs = jest.fn()
        framework.report = jest.fn(() => {
            // Simulate nuggets having passed when run
            framework.setNuggetStatus('isTasty.js', 'passed', 'queued', true)
            framework.setNuggetStatus('111', 'passed', 'queued', false)
            framework.setNuggetStatus('222', 'passed', 'queued', false)
            framework.setNuggetStatus('333', 'passed', 'queued', false)
            framework.setNuggetStatus('444', 'passed', 'queued', false)

            return Promise.resolve()
        })

        // Trigger queued run
        Object.values(framework.queue)[0]()

        await assemble()
        expect(framework.status).toBe('running')
        expect(Object.values(framework.getStatusMap()).every(status => status === 'queued')).toBe(true)

        await flushPromises()

        expect(framework.assemble).toHaveBeenCalledTimes(1)
        expect(framework.reload).toHaveBeenCalledTimes(1)
        expect(framework.runArgs).toHaveBeenCalledTimes(1)
        expect(framework.runSelectiveArgs).not.toHaveBeenCalled()
        expect(framework.report).toHaveBeenCalledTimes(1)
        expect(framework.report).toHaveBeenCalledWith(['hobnobs', 'digestives'])
        expect(framework.disassemble).toHaveBeenCalledTimes(1)
        expect(framework.isBusy()).toBe(false)
        expect(framework.getAllSuites().length).toBe(1)
        expect(framework.getAllSuites()[0].getId()).toBe('isTasty.js')
        expect(framework.getNuggetStatus('isTasty.js')).toBe('passed')
        expect(framework.getSuiteById('isNobbly.js')).toBe(undefined)
        expect(framework.status).toBe('passed')

        jest.runAllTimers()
        expect(framework.emitToRenderer).toHaveBeenLastCalledWith(
            `${framework.id}:ledger`,
            {
                queued: 0,
                running: 0,
                passed: 1,
                failed: 0,
                incomplete: 0,
                skipped: 0,
                warning: 0,
                partial: 0,
                empty: 0,
                idle: 0,
                error: 0
            },
            {
                '111': 'passed',
                '222': 'passed',
                '333': 'passed',
                '444': 'passed',
                'isTasty.js': 'passed'
            }
        )
    })

    it('handles framework errors when running', async () => {
        const framework = new Framework(new ApplicationWindow(), options)
        await flushPromises()

        // Set an arbitrary status to ensure they are kept after refresh
        framework.setNuggetStatus('isTasty.js', 'passed', 'idle', true)

        framework.start()
        framework.assemble = jest.fn()
        framework.disassemble = jest.fn()
        framework.emit = jest.fn()
        framework.emitToRenderer = jest.fn()
        framework.reload = jest.fn(() => {
            framework.getAllSuites().forEach(suite => suite.setFresh(true))
            return Promise.resolve()
        })
        framework.runArgs = jest.fn()
        framework.runSelectiveArgs = jest.fn()
        const error = new Error('Boomtown!')
        framework.report = jest.fn(() => Promise.reject(error))

        // Trigger queued run
        Object.values(framework.queue)[0]()

        await flushPromises()

        expect(framework.assemble).toHaveBeenCalledTimes(1)
        expect(framework.reload).toHaveBeenCalledTimes(1)
        expect(framework.runArgs).toHaveBeenCalledTimes(1)
        expect(framework.runSelectiveArgs).not.toHaveBeenCalled()
        expect(framework.report).toHaveBeenCalledTimes(1)
        expect(framework.disassemble).toHaveBeenCalledTimes(1)
        expect(framework.isBusy()).toBe(false)
        expect(framework.getAllSuites().length).toBe(2)
        expect(Object.entries(framework.getStatusMap()).every(([id, status]) => status === 'idle')).toBe(true)
        expect(framework.status).toBe('error')

        expect(framework.emit).toHaveBeenCalledWith('error', error)
        expect(framework.emitToRenderer).toHaveBeenLastCalledWith(`${framework.id}:error`, 'Error: Boomtown!', '')

        jest.runAllTimers()
        expect(framework.emitToRenderer).toHaveBeenLastCalledWith(
            `${framework.id}:ledger`,
            {
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
            },
            {
                '111': 'idle',
                '222': 'idle',
                '333': 'idle',
                '444': 'idle',
                '555': 'idle',
                'isTasty.js': 'idle',
                'isNobbly.js': 'idle'
            }
        )
    })

    it('interrupts framework run if reload is stopped', async () => {
        const framework = new Framework(new ApplicationWindow(), options)
        await flushPromises()

        // Set an arbitrary status to ensure they are kept after refresh
        framework.setNuggetStatus('isTasty.js', 'passed', 'idle', true)

        framework.start()
        framework.assemble = jest.fn()
        framework.disassemble = jest.fn()
        framework.emit = jest.fn()
        framework.emitToRenderer = jest.fn()
        framework.reload = jest.fn(() => {
            framework.getAllSuites().forEach(suite => suite.setFresh(true))
            // Simulate reload process being killed
            return Promise.resolve('killed')
        })
        framework.runArgs = jest.fn()
        framework.runSelectiveArgs = jest.fn()
        framework.report = jest.fn()

        // Trigger queued run
        Object.values(framework.queue)[0]()

        framework.stop()
        await flushPromises()

        expect(framework.assemble).toHaveBeenCalledTimes(1)
        expect(framework.reload).toHaveBeenCalledTimes(1)
        expect(framework.runArgs).not.toHaveBeenCalled()
        expect(framework.runSelectiveArgs).not.toHaveBeenCalled()
        expect(framework.report).not.toHaveBeenCalled()
        expect(framework.disassemble).toHaveBeenCalledTimes(1)
        expect(framework.isBusy()).toBe(false)
        expect(framework.getAllSuites().length).toBe(2)

        // Despite interruption, since run was triggered, all nuggets are now idle.
        expect(Object.entries(framework.getStatusMap()).every(([id, status]) => status === 'idle')).toBe(true)
        expect(framework.status).toBe('idle')

        jest.runAllTimers()
        expect(framework.emitToRenderer).toHaveBeenLastCalledWith(
            `${framework.id}:ledger`,
            {
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
            },
            {
                '111': 'idle',
                '222': 'idle',
                '333': 'idle',
                '444': 'idle',
                '555': 'idle',
                'isTasty.js': 'idle',
                'isNobbly.js': 'idle'
            }
        )
    })


    it('interrupts framework run if reload errors', async () => {
        const framework = new Framework(new ApplicationWindow(), options)
        await flushPromises()

        // Set an arbitrary status to ensure they are kept after refresh
        framework.setNuggetStatus('isTasty.js', 'passed', 'idle', true)

        framework.start()
        framework.assemble = jest.fn()
        framework.disassemble = jest.fn()
        framework.emit = jest.fn()
        framework.emitToRenderer = jest.fn()
        framework.reload = jest.fn(() => {
            framework.getAllSuites().forEach(suite => suite.setFresh(true))
            const error = new Error('Boomtown!')
            return Promise.reject(error)
        })
        framework.runArgs = jest.fn()
        framework.runSelectiveArgs = jest.fn()
        framework.report = jest.fn()

        // Trigger queued run
        Object.values(framework.queue)[0]()

        await flushPromises()

        expect(framework.assemble).toHaveBeenCalledTimes(1)
        expect(framework.reload).toHaveBeenCalledTimes(1)
        expect(framework.runArgs).not.toHaveBeenCalled()
        expect(framework.runSelectiveArgs).not.toHaveBeenCalled()
        expect(framework.report).not.toHaveBeenCalled()
        expect(framework.disassemble).toHaveBeenCalledTimes(1)
        expect(framework.isBusy()).toBe(false)
        expect(framework.getAllSuites().length).toBe(2)

        // Despite error, since run was triggered, all nuggets are now idle.
        expect(Object.entries(framework.getStatusMap()).every(([id, status]) => status === 'idle')).toBe(true)
        expect(framework.status).toBe('error')

        jest.runAllTimers()
        expect(framework.emitToRenderer).toHaveBeenLastCalledWith(
            `${framework.id}:ledger`,
            {
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
            },
            {
                '111': 'idle',
                '222': 'idle',
                '333': 'idle',
                '444': 'idle',
                '555': 'idle',
                'isTasty.js': 'idle',
                'isNobbly.js': 'idle'
            }
        )
    })
})

describe('Framework selective running', () => {
    it('ignores selectively running if nothing is selected', async () => {
        const framework = new Framework(new ApplicationWindow(), options)
        await flushPromises()

        framework.run = jest.fn().mockReturnValue('biscuit')

        expect(framework.runSelective()).resolves.toBe('biscuit')
        expect(framework.run).toHaveBeenCalledTimes(1)
    })

    it('can run a framework selectively', async () => {
        const framework = new Framework(new ApplicationWindow(), options)
        await flushPromises()

        const suite = framework.getSuiteById('isTasty.js')
        await suite.toggleSelected()

        // Running should queue the job before running
        framework.start()
        expect(framework.status).toBe('queued')
        expect(Object.values(framework.queue).length).toBe(1)
        expect(Object.values(framework.queue)[0]).toBeInstanceOf(Function)
        expect(framework.isBusy()).toBe(true)

        let assemble
        framework.assemble = jest.fn(() => {
            return new Promise(resolve => {
                assemble = resolve
            })
        })
        framework.disassemble = jest.fn()
        framework.emit = jest.fn()
        framework.emitToRenderer = jest.fn()
        framework.reload = jest.fn()
        framework.runArgs = jest.fn()
        framework.runSelectiveArgs = jest.fn(() => ['hobnobs', 'digestives'])
        framework.report = jest.fn(() => {
            // Simulate nuggets having passed when run
            framework.setNuggetStatus('isTasty.js', 'passed', 'queued', true)
            framework.setNuggetStatus('111', 'passed', 'queued', false)
            framework.setNuggetStatus('222', 'passed', 'queued', false)
            framework.setNuggetStatus('333', 'passed', 'queued', false)
            framework.setNuggetStatus('444', 'passed', 'queued', false)

            return Promise.resolve()
        })

        // Trigger queued run
        Object.values(framework.queue)[0]()

        await assemble()
        // Framework is running, but only selected suites have been queued.
        expect(framework.status).toBe('running')
        expect(
            Object.entries(framework.getStatusMap())
                .filter(([id]) => ['isNobbly.js', '555'].indexOf(id) === -1)
                .every(([id, status]) => status === 'queued')
        ).toBe(true)
        expect(framework.getNuggetStatus('isNobbly.js')).toBe('idle')
        expect(framework.getNuggetStatus('555')).toBe('idle')

        await flushPromises()

        expect(framework.assemble).toHaveBeenCalledTimes(1)
        expect(framework.reload).not.toHaveBeenCalled()
        expect(framework.runArgs).not.toHaveBeenCalled()
        expect(framework.runSelectiveArgs).toHaveBeenCalledTimes(1)
        expect(framework.report).toHaveBeenCalledTimes(1)
        expect(framework.report).toHaveBeenCalledWith(['hobnobs', 'digestives'])
        expect(framework.disassemble).toHaveBeenCalledTimes(1)
        expect(framework.isBusy()).toBe(false)
        expect(framework.getAllSuites().length).toBe(2)
        expect(framework.getNuggetStatus('isTasty.js')).toBe('passed')
        expect(framework.getNuggetStatus('isNobbly.js')).toBe('idle')
        expect(framework.status).toBe('partial')

        jest.runAllTimers()
        expect(framework.emitToRenderer).toHaveBeenLastCalledWith(
            `${framework.id}:ledger`,
            {
                queued: 0,
                running: 0,
                passed: 1,
                failed: 0,
                incomplete: 0,
                skipped: 0,
                warning: 0,
                partial: 0,
                empty: 0,
                idle: 1,
                error: 0
            },
            {
                '111': 'passed',
                '222': 'passed',
                '333': 'passed',
                '444': 'passed',
                '555': 'idle',
                'isTasty.js': 'passed',
                'isNobbly.js': 'idle'
            }
        )
    })

    it('marks suites as having errored if not run when selected', async () => {
        const framework = new Framework(new ApplicationWindow(), options)
        await flushPromises()

        const suite = framework.getSuiteById('isTasty.js')
        await suite.toggleSelected()

        // Running should queue the job before running
        framework.start()
        expect(framework.status).toBe('queued')
        expect(Object.values(framework.queue).length).toBe(1)
        expect(Object.values(framework.queue)[0]).toBeInstanceOf(Function)
        expect(framework.isBusy()).toBe(true)

        framework.assemble = jest.fn()
        framework.disassemble = jest.fn()
        framework.emit = jest.fn()
        framework.emitToRenderer = jest.fn()
        framework.runSelectiveArgs = jest.fn()
        // Report doesn't do anything, to simulate selected suite not being
        // affected by the reporting process.
        framework.report = jest.fn(() => Promise.resolve())

        // Trigger queued run
        Object.values(framework.queue)[0]()
        await flushPromises()

        expect(framework.assemble).toHaveBeenCalledTimes(1)
        expect(framework.runSelectiveArgs).toHaveBeenCalledTimes(1)
        expect(framework.report).toHaveBeenCalledTimes(1)
        expect(framework.disassemble).toHaveBeenCalledTimes(1)
        expect(framework.isBusy()).toBe(false)
        expect(framework.getAllSuites().length).toBe(2)
        expect(framework.getNuggetStatus('isTasty.js')).toBe('error')
        expect(framework.getNuggetStatus('isNobbly.js')).toBe('idle')
        expect(framework.status).toBe('error')

        jest.runAllTimers()
        expect(framework.emitToRenderer).toHaveBeenLastCalledWith(
            `${framework.id}:ledger`,
            {
                queued: 0,
                running: 0,
                passed: 0,
                failed: 0,
                incomplete: 0,
                skipped: 0,
                warning: 0,
                partial: 0,
                empty: 0,
                idle: 1,
                error: 1
            },
            {
                '111': 'error',
                '222': 'error',
                '333': 'error',
                '444': 'error',
                '555': 'idle',
                'isTasty.js': 'error',
                'isNobbly.js': 'idle'
            }
        )
    })

    it('handles framework errors when running selectively', async () => {
        const framework = new Framework(new ApplicationWindow(), options)
        await flushPromises()

        const suite = framework.getSuiteById('isTasty.js')
        await suite.toggleSelected()

        framework.start()
        framework.assemble = jest.fn()
        framework.disassemble = jest.fn()
        framework.emit = jest.fn()
        framework.emitToRenderer = jest.fn()
        framework.runSelectiveArgs = jest.fn()
        const error = new Error('Boomtown!')
        framework.report = jest.fn(() => Promise.reject(error))

        // Run queued refresh
        Object.values(framework.queue)[0]()

        await flushPromises()

        expect(framework.assemble).toHaveBeenCalledTimes(1)
        expect(framework.runSelectiveArgs).toHaveBeenCalledTimes(1)
        expect(framework.report).toHaveBeenCalledTimes(1)
        expect(framework.disassemble).toHaveBeenCalledTimes(1)
        expect(framework.isBusy()).toBe(false)
        expect(framework.getAllSuites().length).toBe(2)
        expect(Object.entries(framework.getStatusMap()).every(([id, status]) => status === 'idle')).toBe(true)
        expect(framework.status).toBe('error')

        expect(framework.emit).toHaveBeenCalledWith('error', error)
        expect(framework.emitToRenderer).toHaveBeenLastCalledWith(`${framework.id}:error`, 'Error: Boomtown!', '')

        jest.runAllTimers()
        expect(framework.emitToRenderer).toHaveBeenLastCalledWith(
            `${framework.id}:ledger`,
            {
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
            },
            {
                '111': 'idle',
                '222': 'idle',
                '333': 'idle',
                '444': 'idle',
                '555': 'idle',
                'isTasty.js': 'idle',
                'isNobbly.js': 'idle'
            }
        )
    })
})
