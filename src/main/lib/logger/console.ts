export class Console {

    public log (...data: Array<any>): void {
        this.commit('log', ...data)
    }

    public dir (obj: any): void {
        this.commit('dir', obj)
    }

    public group (...label: Array<any>): void {
        this.commit('group', ...label)
    }

    public groupEnd (): void {
        this.commit('groupEnd')
    }

    public count (label: string = 'default'): void {
        this.commit('count', label)
    }

    public countReset (label: string = 'default'): void {
        this.commit('countReset', label)
    }

    public commit (method: string, ...data: Array<any>): void {
        if (__SILENT__) {
            return
        }

        (console as any)[method].apply(console, data)

        // @TODO: log this to a toggleable pseudo-console
        // inside the app, with date and time
    }
}
