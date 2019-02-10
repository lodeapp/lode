import { remote } from 'electron'

export class Menu {

    protected menu: Electron.Menu
    protected options: object = {}

    constructor () {
        this.menu = new remote.Menu()
    }

    add (item: Electron.MenuItemConstructorOptions): this {
        this.menu.append(new remote.MenuItem(item))
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

    separator (): this {
        this.add({ type: 'separator' })
        return this
    }

    before (callback: Function): this {
        this.menu.on('menu-will-show', () => {
            callback()
        })
        return this
    }

    after (callback: Function): this {
        this.menu.on('menu-will-close', () => {
            callback()
        })
        return this
    }

    attachTo(element: Element): this {
        const { x, y, height } = <DOMRect>element.getBoundingClientRect()
        this.options = {
            ...this.options,
            ...{
                x: Math.ceil(x),
                y: Math.ceil(y + height + 6)
            }
        }
        return this
    }

    open (options?: object): this {
        this.menu.popup({
            ...this.options,
            ...{ window: remote.getCurrentWindow() },
            ...(options || {})
        })
        return this
    }
}
