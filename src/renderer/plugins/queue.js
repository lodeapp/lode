import Bottleneck from 'bottleneck'

export default class Queue {
    constructor () {
        this.limiter = new Bottleneck({
            maxConcurrent: 3
        })
    }

    install (Vue) {
        Vue.prototype.$queue = this
    }

    add (job) {
        const wrapped = this.limiter.wrap(job)
        wrapped()
    }

    stop () {
        this.limiter.stop()
    }
}
