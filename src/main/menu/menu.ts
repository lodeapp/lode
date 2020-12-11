import { ApplicationWindow } from '@main/application-window'
import { File } from '@main/file'
import { Menu as Base } from 'electron'

export class Menu {

    protected window: ApplicationWindow
    protected built: boolean = false
    protected menu: Electron.Menu | null = null
    protected options: object = {}
    protected template: Array<Electron.MenuItemConstructorOptions> = []
    protected beforeCallbacks: Array<Function> = []
    protected afterCallbacks: Array<Function> = []

    constructor (webContents: Electron.WebContents) {
        this.window = ApplicationWindow.getFromWebContents(webContents)!
    }

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

    attachTo (rect: DOMRect | undefined): this {
        if (rect) {
            const { x, y, height } = rect
            this.options = {
                ...this.options,
                ...{
                    x: Math.ceil(x),
                    y: Math.ceil(y + height + 7)
                }
            }
        }
        return this
    }

    build (): this {
        this.menu = Base.buildFromTemplate(this.template)

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
            ...{ window: this.window.getChild() },
            ...(options || {})
        })
        return this
    }

    public getTemplate (): Array<Electron.MenuItemConstructorOptions> {
        return this.template
    }

    public emit (name: MenuEvent, properties?: any) {
        this.window.sendMenuEvent({ name, properties })
    }

    public async openFile (path: string): Promise<void> {
        try {
            await File.open(path)
        } catch (error) {
            log.error(`Error while trying to open file in path: '${path}'`, error)
            this.window.send('error', [
                'Unable to open file in an external program. Please check you have a program associated with this file extension.',
                'The following path was attempted: `' + path + '`',
            ])
        }
    }
}
