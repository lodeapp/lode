import Bottleneck from 'bottleneck'

export default class Queue {
    install (Vue) {
        Vue.prototype.$queue = this
    }

    constructor () {
        this.limiter = new Bottleneck({
            maxConcurrent: 3
        })
    }

    add (job) {
        const wrapped = this.limiter.wrap(job)
        wrapped()
    }

    stop () {
        this.limiter.stop()
    }
}
