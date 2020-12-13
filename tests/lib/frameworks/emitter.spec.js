import { ApplicationWindow } from '@main/application-window'
import { ProjectEventEmitter } from '@lib/frameworks/emitter'

jest.mock('@lib/state')
jest.mock('electron-store')
jest.mock('@main/application-window')

describe('lib/frameworks/emitter', () => {
    it('can return the associated application window', async () => {
        const window = new ApplicationWindow()
        const emitter = new ProjectEventEmitter(window)
        expect(emitter.getApplicationWindow()).toBe(window)
    })

    it('can emit events to the application window', async () => {
        const window = new ApplicationWindow()
        window.canReceiveEvents = jest.fn(() => true)

        const emitter = new ProjectEventEmitter(window)

        // Can emit with no arguments
        emitter.emitToRenderer('biscuit')
        expect(window.send).toHaveBeenLastCalledWith('biscuit', [])

        // Can emit with arguments
        emitter.emitToRenderer('biscuit', 'Hobnobs', 'Digestives', 'Rich Tea')
        expect(window.send).toHaveBeenLastCalledWith('biscuit', ['Hobnobs', 'Digestives', 'Rich Tea'])

        expect(window.send).toHaveBeenCalledTimes(2)
    })

    it('does not emit events if the application window is blocking them', async () => {
        const window = new ApplicationWindow()
        window.canReceiveEvents = jest.fn(() => false)

        const emitter = new ProjectEventEmitter(window)
        emitter.emitToRenderer('biscuit')
        expect(window.send).not.toHaveBeenCalled()
    })
})
