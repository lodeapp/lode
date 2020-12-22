import {
    unpacked,
    loc,
    posix
} from '@lib/helpers/paths'

it('can handled unpacking paths that are not in packed path', () => {
    expect(unpacked('biscuit')).toBe('biscuit')
    expect(unpacked('/biscuit/mcvities/hobnobs/')).toBe('/biscuit/mcvities/hobnobs/')
    expect(unpacked('/appasar/mcvities/hobnobs/')).toBe('/appasar/mcvities/hobnobs/')
    expect(unpacked('/app/asar/mcvities/hobnobs/')).toBe('/app/asar/mcvities/hobnobs/')
    expect(unpacked('/app.asarfoo/mcvities/hobnobs/')).toBe('/app.asarfoo/mcvities/hobnobs/')
    expect(unpacked('/fooapp.asar/mcvities/hobnobs/')).toBe('/fooapp.asar/mcvities/hobnobs/')
})

it('can point paths to unpacked directory', () => {
    expect(unpacked('/app.asar/mcvities/hobnobs/')).toBe('/app.asar.unpacked/mcvities/hobnobs/')
    expect(unpacked('/biscuit/app.asar/hobnobs/')).toBe('/biscuit/app.asar.unpacked/hobnobs/')
    expect(unpacked('/biscuit/mcvities/app.asar/')).toBe('/biscuit/mcvities/app.asar.unpacked/')
    expect(unpacked('/biscuit/mcvities/app.asar')).toBe('/biscuit/mcvities/app.asar.unpacked/')
})

it('can standardise separators', () => {
    expect(loc('biscuit')).toBe('biscuit')
    expect(loc('biscuit/mcvities')).toBe(
        __WIN32__
            ? 'biscuit\\mcvities'
            : 'biscuit/mcvities'
    )
    expect(loc('/biscuit/mcvities/hobnobs/')).toBe(
        __WIN32__
            ? '\\biscuit\\mcvities\\hobnobs\\'
            : '/biscuit/mcvities/hobnobs/'
    )
})

it('can force POSIX separators in non-POSIX platforms', () => {
    expect(posix('biscuit')).toBe('biscuit')
    expect(posix('biscuit/mcvities')).toBe('biscuit/mcvities')
    expect(posix('/biscuit/mcvities/hobnobs/')).toBe('/biscuit/mcvities/hobnobs/')
    expect(posix('biscuit\\mcvities')).toBe(
        __WIN32__
            ? 'biscuit/mcvities'
            : 'biscuit\\mcvities' // Non-POSIX platforms don't know the separator, so it remains unaltered.
    )
    expect(posix('\\biscuit\\mcvities\\hobnobs\\')).toBe(
        __WIN32__
            ? '/biscuit/mcvities/hobnobs/'
            : '\\biscuit\\mcvities\\hobnobs\\' // See above.
    )
})
