import * as Fs from 'fs-extra'
import { Jest } from '@lib/frameworks/jest/framework'

jest.mock('fs-extra')
jest.mock('@lib/state')
jest.mock('electron-store')
jest.mock('@main/application-window')

describe('lib/frameworks/jest/framework', () => {
    it('does not spawn Jest framework for empty repository', async () => {
        expect(await Jest.spawnForDirectory({ files: [] })).toBe(false)
    })

    it('does not spawn Jest framework for repository not containing package.json', async () => {
        expect(await Jest.spawnForDirectory({ files: ['biscuit.json'] })).toBe(false)
        expect(await Jest.spawnForDirectory({ files: ['apackage.json'] })).toBe(false)
        expect(await Jest.spawnForDirectory({ files: ['packagez.json'] })).toBe(false)
        expect(await Jest.spawnForDirectory({ files: ['package.zip'] })).toBe(false)
    })

    it('does not spawn Jest framework for repository with package.json without scripts', async () => {
        Fs.readJson.mockReturnValue({
            'biscuits': {}
        })
        expect(await Jest.spawnForDirectory({ files: ['package.json'], path: 'biscuits' })).toBe(false)
    })

    test.each([
        'cross-env NODE_ENV=production webpack --mode production --config webpack.jest.config.js',
        'webpack --mode production --config webpack.jest.config.js',
        'jjest',
        'jxest',
        'jestz',
        'jest.config.js',
        'hest',
        'jest.test',
        'pack:jest',
        'hey'
    ])('does not spawn Jest framework for repository with package.json script "%s"', async (script) => {
        Fs.readJson.mockReturnValue({
            'scripts': {
                script
            }
        })
        expect(await Jest.spawnForDirectory({ files: ['package.json'], path: 'biscuits' })).toBe(false)
    })

    test.each([
        './node_modules/jest/bin/jest.js',
        'C:\\node_modules\\jest\\bin\\jest.js',
        'jest.js',
        'jest',
        'jest --hey --ho'
    ])('spawns Jest framework for repository with package.json script "%s"', async (script) => {
        Fs.readJson.mockReturnValue({
            'scripts': {
                script
            }
        })
        expect(await Jest.spawnForDirectory({ files: ['package.json'], path: 'biscuits' })).toEqual({
            'command': 'yarn script',
            'name': 'Jest',
            'path': '',
            'proprietary': {},
            'runsInRemote': false,
            'type': 'jest'
        })
    })

    it('spawns Jest framework from the first script and uses its key', async () => {
        Fs.readJson.mockReturnValue({
            'scripts': {
                one: 'jest',
                two: 'jest'
            }
        })
        const options = await Jest.spawnForDirectory({ files: ['package.json'], path: 'biscuits' })
        expect(options.command).toBe('yarn one')
    })
})
