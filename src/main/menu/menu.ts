import { remote } from 'electron'

export class Menu {

    protected built: boolean = false
    protected menu: Electron.Menu | null = null
    protected options: object = {}
    protected template: Array<Electron.MenuItemConstructorOptions> = []
    protected beforeCallbacks: Array<Function> = []
    protected afterCallbacks: Array<Function> = []

    add (item: Electron.MenuItemConstructorOptions): this {
        this.template.push(item)
        return this
    }

    addIf (
        condition: boolean | Function,
        item: Electron.MenuItemConstructorOptions
    ): this {
        if (condition) {
            this.add(item)
        }
        return this
    }

    addMultiple (items: Array<Electron.MenuItemConstructorOptions>): this {
        items.forEach((item: Electron.MenuItemConstructorOptions) => {
            this.add(item)
        })
        return this
    }

    separator (): this {
        this.add({ type: 'separator' })
        return this
    }

    before (callback: Function): this {
        this.beforeCallbacks.push(callback)
        return this
    }

    after (callback: Function): this {
        this.afterCallbacks.push(callback)
        return this
    }

    attachTo(element: Element | undefined): this {
        if (element) {
            const { x, y, height } = <DOMRect>element.getBoundingClientRect()
            this.options = {
                ...this.options,
                ...{
                    x: Math.ceil(x),
                    y: Math.ceil(y + height + 6)
                }
            }
        }
        return this
    }

    build (): this {
        this.menu = remote.Menu.buildFromTemplate(this.template)

        if (this.beforeCallbacks.length) {
            this.beforeCallbacks.forEach(callback => {
                this.menu!.on('menu-will-show', () => {
                    callback()
                })
            })
        }

        if (this.afterCallbacks.length) {
            this.afterCallbacks.forEach(callback => {
                this.menu!.on('menu-will-close', () => {
                    callback()
                })
            })
        }

        this.built = true
        return this
    }

    open (options?: object): this {

        if (!this.built) {
            this.build()
        }

        this.menu!.popup({
            ...this.options,
            ...{ window: remote.getCurrentWindow() },
            ...(options || {})
        })
        return this
    }
}
