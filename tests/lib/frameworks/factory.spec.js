import { ApplicationWindow } from '@main/application-window'
import { FrameworkFactory } from '@lib/frameworks/factory'
import { PHPUnit } from '@lib/frameworks/phpunit/framework'

jest.mock('@lib/state')
jest.mock('electron-store')
jest.mock('@main/application-window')

it('can make a new framework', async () => {
    const window = new ApplicationWindow()
    const options = {
        id: '42',
        type: 'phpunit'
    }

    const framework = FrameworkFactory.make(window, options)
    expect(framework).toBeInstanceOf(PHPUnit)
    // Persists id
    expect(framework.id).toBe('42')
    // Hydrates with default options, including proprietary and OS-specific
    expect(framework.name).toBe('PHPUnit (Legacy)')
    expect(framework.proprietary).toEqual({
        autoloadPath: ''
    })
    expect(framework.command).toBe(
        __WIN32__
            ? 'php vendor/phpunit/phpunit/phpunit'
            : './vendor/bin/phpunit'
    )
})

it('fails if type does not exist', async () => {
    const window = new ApplicationWindow()
    const options = {
        type: 'biscuit'
    }

    expect(() => {
        FrameworkFactory.make(window, options)
    }).toThrow('Unknown framework type "biscuit"')
})
