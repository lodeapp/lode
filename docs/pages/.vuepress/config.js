module.exports = {
    title: 'Lode',
    description: 'Universal graphical interface for unit testing.',
    base: '/lode/',
    head: [
        ['link', { rel: 'icon', href: '/favicon.png' }]
    ],
    ga: 'UA-103701546-2',
    markdown: {
        extendMarkdown: md => {
            md.set({ typographer: true })
        }
    },
    themeConfig: {
        logo: '/logo-horizontal.svg',
        nav: [
            { text: 'Overview', link: '/' },
            { text: 'Documentation', link: '/documentation/' },
            { text: 'Release Notes', link: '/release-notes/' },
            { text: 'GitHub', link: 'https://github.com/lodeapp/lode' }
        ],
        sidebar: {
            '/documentation/': [
                ['', 'Introduction'],
                'getting-started',
                'frameworks',
                'support'
            ]
        },
        lastUpdated: 'Last Updated'
    }
}
