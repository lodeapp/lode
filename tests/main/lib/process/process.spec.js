import DefaultProcess from '@lib/process/process'

describe('main/lib/process/DefaultProcess', () => {
    it('fails', () => {
        expect(new DefaultProcess('test')).toBe(false)
    })
})
