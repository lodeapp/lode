import ua from 'universal-analytics'
import { state } from '@lib/state'

function initializeTracker (): any {
    return ua(__ANALYTICS_ID__, state.get('userid'))
}

let trackerPromise: Promise<any> | null = null

function getTracker (): Promise<any> {
    if (trackerPromise) {
        return trackerPromise
    }

    trackerPromise = new Promise<any>((resolve, reject) => {
        try {
            resolve(initializeTracker())
        } catch (err) {
            reject(err)
        }
    })

    return trackerPromise
}

class Track {
    protected async send (...params: Array<string | null>): Promise<void> {
        try {
            const method = params.shift()
            if (__DEV__ || process.env.NODE_ENV !== 'production') {
                console.log('Tracking [' + method + ']', params.join(', '))
                return
            }

            const tracker = await getTracker()
            await new Promise<void>((resolve, reject) => {
                tracker[method!](...params).send()
                resolve()
            })
        } catch (error) {
            // ...
        }
    }

    public async screenview (...params: Array<string | null>): Promise<void> {
        return this.send('screenview', ...params)
    }

    public async event (...params: Array<string | null>): Promise<void> {
        return this.send('event', ...params)
    }
}

export const track = new Track()

