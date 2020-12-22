import Strings from '@lib/helpers/strings'

const helper = new Strings()

it('generates random strings', () => {
    const random = helper.random()
    expect(random).toMatch(new RegExp('[a-z0-9]{15}', 'i'))
    expect(random !== helper.random()).toBeTruthy()
})

it('cleans diacritics from strings', () => {
    expect(helper.ascii('Ȟøƃƞóḇş'))
        .toBe('Hobnobs')

    // No diacritics should be fine, too
    expect(helper.ascii('Hobnobs'))
        .toBe('Hobnobs')
})

it('can truncate strings after a given length', () => {
    expect(helper.truncate('Lorem ipsum', 6))
        .toBe('Lorem…')
})

it('can truncate strings with a custom omission character', () => {
    expect(helper.truncate('Lorem ipsum', 6, { omission: '!' }))
        .toBe('Lorem!')
})

it('can truncate strings with custom separator logic', () => {
    expect(helper.truncate('Lorem ipsum dolor sit amet', 15))
        .toBe('Lorem ipsum do…')

    expect(helper.truncate('Lorem ipsum dolor sit amet', 15, { separator: ' ' }))
        .toBe('Lorem ipsum…')
})

it('doesn\'t fail when attempting to truncate invalid strings', () => {
    expect(helper.truncate(null, 1))
        .toBe('')

    expect(helper.truncate(undefined, 1))
        .toBe('')
})

it('can compose strings with placeholders', () => {
    expect(helper.set('Lorem')).toBe('Lorem')
    expect(helper.set('Lorem :0', 'ipsum')).toBe('Lorem ipsum')
    expect(helper.set('Lorem :0 :1 :2 :3', 'ipsum', 'dolor', 'sit', 'amet')).toBe('Lorem ipsum dolor sit amet')
    expect(helper.set('Lorem :1', 'Missing index', 'ipsum')).toBe('Lorem ipsum')
    expect(helper.set('Lorem :1 :2 :3 :4', {
        '2': 'dolor',
        '4': 'amet',
        '1': 'ipsum',
        '3': 'sit'
    })).toBe('Lorem ipsum dolor sit amet')
})

it('can parse Markdown text', () => {
    expect(helper.markdown(''))
        .toBe('')
    expect(helper.markdown('Lorem **ipsum** _dolor_'))
        .toBe('Lorem <strong>ipsum</strong> <em>dolor</em>')
    expect(helper.markdown('A [spiffy link](#)'))
        .toBe('A <a href="#">spiffy link</a>')
    expect(helper.markdown('Lorem ipsum dolor sit amet\nLorem ipsum dolor sit amet'))
        .toBe('Lorem ipsum dolor sit amet\nLorem ipsum dolor sit amet')
})

it('can parse Markdown text into block elements', () => {
    expect(helper.markdownBlock('Leading text _italic_ trailing text'))
        .toBe('<p>Leading text <em>italic</em> trailing text</p>\n')
    expect(helper.markdownBlock('Leading text *italic* trailing text'))
        .toBe('<p>Leading text <em>italic</em> trailing text</p>\n')
    expect(helper.markdownBlock('Leading text __bold__ trailing text'))
        .toBe('<p>Leading text <strong>bold</strong> trailing text</p>\n')
    expect(helper.markdownBlock('Leading text **bold** trailing text'))
        .toBe('<p>Leading text <strong>bold</strong> trailing text</p>\n')
    expect(helper.markdownBlock('Lorem ipsum dolor sit amet\nLorem ipsum dolor sit amet'))
        .toBe('<p>Lorem ipsum dolor sit amet<br>\nLorem ipsum dolor sit amet</p>\n')
    expect(helper.markdownBlock('# Heading 1'))
        .toBe('<h1>Heading 1</h1>\n')
    expect(helper.markdownBlock('## Heading 2'))
        .toBe('<h2>Heading 2</h2>\n')
    expect(helper.markdownBlock('### Heading 3'))
        .toBe('<h3>Heading 3</h3>\n')
    expect(helper.markdownBlock('#### Heading 4'))
        .toBe('<h4>Heading 4</h4>\n')
    expect(helper.markdownBlock('##### Heading 5'))
        .toBe('<h5>Heading 5</h5>\n')
    expect(helper.markdownBlock('###### Heading 6'))
        .toBe('<h6>Heading 6</h6>\n')
    expect(helper.markdownBlock('# Heading 1\nLorem ipsum dolor sit amet\nLorem ipsum dolor sit amet'))
        .toBe('<h1>Heading 1</h1>\n<p>Lorem ipsum dolor sit amet<br>\nLorem ipsum dolor sit amet</p>\n')
    expect(helper.markdownBlock('- List item 1\n- List item 2'))
        .toBe('<ul>\n<li>List item 1</li>\n<li>List item 2</li>\n</ul>\n')
})

it('uses advanced text replacement when parsing Markdown', () => {
    expect(helper.markdown('Leading text ... trailing text'))
        .toBe('Leading text … trailing text')
    expect(helper.markdown('Leading text --- trailing text'))
        .toBe('Leading text — trailing text')
    expect(helper.markdown('Leading text -- trailing text'))
        .toBe('Leading text – trailing text')
    expect(helper.markdown('"Hobnobs"'))
        .toBe('“Hobnobs”')
    expect(helper.markdown("'Hobnobs'"))
        .toBe('‘Hobnobs’')
})

it('escapes Markdown with HTML', () => {
    expect(helper.markdown('Leading text <p>HTML</p> trailing text'))
        .toBe('Leading text &lt;p&gt;HTML&lt;/p&gt; trailing text')
    expect(helper.markdown('Leading text <script type="text/javascript">pwnd!!!</script> trailing text'))
        .toBe('Leading text &lt;script type=“text/javascript”&gt;pwnd!!!&lt;/script&gt; trailing text')
})

it('converts objects into hashes', () => {
    expect(helper.from({ biscuit: 'Hobnobs' })).toBe('3c3dce337335fd8eb86a0c78a19e15d4a5721e66')
    expect(helper.from({ biscuit: 'Digestives' })).not.toBe('3c3dce337335fd8eb86a0c78a19e15d4a5721e66')
})

it('object hashing handles strings transparently', () => {
    expect(helper.from('biscuit')).toBe('biscuit')
})

it('can pluralise strings without intervals', () => {
    // It should work even without any replacements
    expect(helper.plural('item|items', 1)).toBe('item')
    expect(helper.plural('item|items', 2)).toBe('items')
})

it('does not fail if plural does not have pipe', () => {
    // It should work even without any replacements
    expect(helper.plural('item', 1)).toBe('item')
    expect(helper.plural('item', 2)).toBe('item')
})

it('can pluralise strings without intervals using numbers as arguments', () => {
    // It should work even without any replacements
    expect(helper.plural('item|items', 1)).toBe('item')
    expect(helper.plural('item|items', 2)).toBe('items')
})

it('can pluralise strings without intervals using numeric strings as arguments', () => {
    // It should work even without any replacements
    expect(helper.plural('item|items', '1')).toBe('item')
    expect(helper.plural('item|items', '2')).toBe('items')
})

it('can set the amount on placeholders when pluralising', () => {
    expect(helper.plural(':n item|:n items', 1)).toBe('1 item')
    expect(helper.plural(':n item|:n items', 2)).toBe('2 items')
})

it('can pluralise strings with intervals', () => {
    expect(helper.plural('{1} :n item|[2,*] :n items', 1)).toBe('1 item')
    expect(helper.plural('{1} :n item|[2,*] :n items', 2)).toBe('2 items')
    expect(helper.plural('{1} :n item|[2] :n items|[3,*] A lot of items', 3)).toBe('A lot of items')
})

it('can handle intervals that do not account for given amount', () => {
    expect(helper.plural('{1} :n item|[2,*] :n items', 0)).toBe('0 item')
    expect(helper.plural('[10,*] :n items', 9)).toBe('9 items')
})

it('can pluralise strings with intervals using numeric strings as arguments', () => {
    expect(helper.plural('{1} :n item|[2,*] :n items', '1')).toBe('1 item')
    expect(helper.plural('{1} :n item|[2,*] :n items', '2')).toBe('2 items')
    expect(helper.plural('{1} :n item|[2] :n items|[3,*] A lot of items', '3')).toBe('A lot of items')
})

it('can parse with wildcard lower intervals', () => {
    expect(helper.plural('{0} No items|[*,3] A few items|[4,*] Many items', 0)).toBe('No items')
    expect(helper.plural('{0} No items|[*,3] A few items|[4,*] Many items', 1)).toBe('A few items')
    expect(helper.plural('{0} No items|[*,3] A few items|[4,*] Many items', 2)).toBe('A few items')
    expect(helper.plural('{0} No items|[*,3] A few items|[4,*] Many items', 3)).toBe('A few items')
    expect(helper.plural('{0} No items|[*,3] A few items|[4,*] Many items', 4)).toBe('Many items')
    expect(helper.plural('{0} No items|[*,3] A few items|[4,*] Many items', 5)).toBe('Many items')
})

it('can parse specific lower intervals', () => {
    expect(helper.plural('[1,3] Too little items|[4,*] Too many items', 1)).toBe('Too little items')
    expect(helper.plural('[1,3] Too little items|[4,*] Too many items', 2)).toBe('Too little items')
    expect(helper.plural('[1,3] Too little items|[4,*] Too many items', 3)).toBe('Too little items')
    expect(helper.plural('[1,3] Too little items|[4,*] Too many items', 4)).toBe('Too many items')
    expect(helper.plural('[1,3] Too little items|[4,*] Too many items', 5)).toBe('Too many items')
})

it('can parse erratic orders', () => {
    expect(helper.plural('[2,*] :n items|{1} :n item', 1)).toBe('1 item')
    expect(helper.plural('[2,*] :n items|{1} :n item', 2)).toBe('2 items')
    expect(helper.plural('[3,*] A lot of items|{1} :n item|[2] :n items', 3)).toBe('A lot of items')
    expect(helper.plural('[4,*] Too many items|[1,3] Too little items', 3)).toBe('Too little items')
    expect(helper.plural('[4,*] Too many items|[1,3] Too little items', 5)).toBe('Too many items')
})

it('works with erratic spaces inside intervals', () => {
    // Allow for translator's formatting quirks
    expect(helper.plural('[ 1, 3 ] Too little items|[ 4 , *] Too many items', 1)).toBe('Too little items')
    expect(helper.plural('[1 , 3] Too little items|[4 ,* ] Too many items', 5)).toBe('Too many items')
})

it('can parse switched delimiters', () => {
    // Don't enforce too many syntax rules
    expect(helper.plural('[1] :n item|{2,*} :n items', 1)).toBe('1 item')
    expect(helper.plural('[1] :n item|{2,*} :n items', 2)).toBe('2 items')
})

it('correctly formats final string when intervals have no spaces after them', () => {
    expect(helper.plural('{1}:n item|[2,*]:n items', 1)).toBe('1 item')
    expect(helper.plural('{1}:n item|[2,*]:n items', 2)).toBe('2 items')
})

it('can handle strings that have a replacement logic of their own', () => {
    expect(helper.plural('{1} :n item named :0 inside :1|[2,*] :n items named :0 inside :1', 1))
        .toBe('1 item named :0 inside :1')
    expect(helper.plural(':n item named :0 inside :1|:n items named :0 inside :1', 2))
        .toBe('2 items named :0 inside :1')
})
