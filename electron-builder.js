const config = {
    productName: 'Lode',
    appId: 'com.recontra.lode',
    directories: {
        buildResources: 'support',
        output: 'build'
    },
    files: [
        'dist/**/*'
    ],
    asar: true,
    asarUnpack: [
        'dist/static/reporters/**/**',
        'dist/preload.js'
    ],
    extends: null,
    mac: {
        category: 'public.app-category.developer-tools',
        icon: 'build/icons/512x512.png',
        hardenedRuntime: true,
        gatekeeperAssess: false,
        entitlements: './support/entitlements.mac.plist',
        entitlementsInherit: './support/entitlements.mac.plist',
        notarize: process.env.NOTARIZE !== 'false'
            ? { teamId: process.env.APPLE_TEAM_ID }
            : false,
        target: [
            {
                target: 'zip',
                arch: [
                    'x64',
                    'arm64'
                ]
            },
            {
                target: 'dmg',
                arch: [
                    'x64',
                    'arm64'
                ]
            }
        ]
    },
    dmg: {
        background: './support/assets/dmg-bg.tiff',
        contents: [
            {
                x: 400,
                y: 150,
                type: 'link',
                path: '/Applications'
            },
            {
                x: 130,
                y: 150,
                type: 'file'
            }
        ],
        window: {
            x: 400,
            y: 200,
            width: 488,
            height: 356
        }
    },
    win: {
        publisherName: ['Tomas Buteler'],
        icon: 'build/icons/512x512.png',
        target: [
            {
                target: 'nsis',
                arch: [
                    'x64'
                ]
            },
            'zip'
        ]
    },
    linux: {
        category: 'Development',
        icon: 'build/icons',
        target: [
            'deb'
        ]
    },
    publish: [
        {
            provider: 'github'
        }
    ]
}

module.exports = config
