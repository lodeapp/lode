export default class Unproxy {
    install (app) {
        app.config.globalProperties.$unproxy = value => JSON.parse(JSON.stringify(value))
    }
}
