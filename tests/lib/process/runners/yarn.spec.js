import { YarnProcess } from '@lib/process/runners/yarn'

describe('main/lib/process/runners/YarnProcess', () => {
    it('owns relevant commands', (done) => {
        expect(YarnProcess.owns('yarn tests')).toBe(true)
        expect(YarnProcess.owns('yarn run tests')).toBe(true)
        expect(YarnProcess.owns('npm run test')).toBe(false)
        expect(YarnProcess.owns('yarna run tests')).toBe(false)
        expect(YarnProcess.owns('iyarn run tests')).toBe(false)
        done()
    })
})
