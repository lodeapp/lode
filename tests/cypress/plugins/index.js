const path = require('path')
const webpackPreprocessor = require('@cypress/webpack-preprocessor')

module.exports = (on, config) => {
    on('file:preprocessor', webpackPreprocessor({
        webpackOptions: {
            module: {
                rules: [
                    {
                        test: /\.ts?$/,
                        loader: 'ts-loader',
                        exclude: /node_modules/
                    },
                    {
                        test: /\.js$/,
                        use: 'babel-loader',
                        exclude: /node_modules/
                    }
                ]
            },
            resolve: {
                alias: {
                    '@preload': path.join(__dirname, '../../../src/preload'),
                    'electron': path.join(__dirname, '../../mocks/electron.js')
                },
                extensions: ['.js', '.ts']
            }
        }
    }))
}
