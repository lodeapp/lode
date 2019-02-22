import Bottleneck from 'bottleneck'
import { state } from '@main/lib/state'

export interface IQueue {
    add (job: any): void
    stop (): void
    getLatestJobName (): string
}

class Queue implements IQueue {
    protected limiter: Bottleneck
    protected latestJob?: Function
    protected latestJobName: string = ''

    constructor () {
        this.limiter = new Bottleneck({
            maxConcurrent: state.get('concurrency')
        })

        // Listen for config changes on concurrency to update the limiter
        state.on('set:concurrency', (value: number) => {
            this.limiter.updateSettings({
                maxConcurrent: value
            })
        })
    }

    public add (job: any): void {
        const wrapped = this.limiter.wrap(job)
        wrapped()
    }

    public latest (name: string, job: any): void {
        this.latestJobName = name
        this.latestJob = job
        job()
    }

    public runLatest (): void {
        if (!this.latestJob) {
            return
        }
        this.add(this.latestJob)
    }

    public stop (): void {
        this.limiter.stop()
    }

    public getLatestJobName (): string {
        return this.latestJobName
    }
}

export const queue = new Queue()
