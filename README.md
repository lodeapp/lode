# [Lode](https://lode.run)

Lode is an open source [Electron](https://electronjs.org/)-based universal test runner graphical user interface. It is written in [TypeScript](http://www.typescriptlang.org) and [Vue](https://vuejs.org/).

![Lode screenshot - macOS](https://lode.run/github-screenshot.png)

## Getting started

You can download the latest pre-packaged version [here](https://lode.run/) or choose a version from the [releases](https://github.com/lodeapp/lode/releases) page. For instructions on how to use the software, see [the documentation](https://lode.run/documentation/).

Lode currently supports the following testing frameworks:

- [PHPUnit](https://lode.run/documentation/frameworks.html#phpunit)
- [Jest](https://lode.run/documentation/frameworks.html#jest)

## Development

To run it locally, you must first clone this repository and run the following commands:

```sh
yarn install
yarn dev
```

Afterwards, to build an application package for the current platform, run the following:

```sh
yarn build
```

Alternatively, you can pack and execute the application directly, which is useful to debug issues that might not occur in development mode. Note that because production state is encrypted, the existing development state will not work:

```sh
yarn simulate
```

The Lode codebase has two sets of tests: [Jest](https://jestjs.io/) for the main process and [Cypress](https://www.cypress.io/) for the renderer process.

```sh
yarn test           # Jest tests
yarn test:cypress   # Cypress tests
yarn cypress        # Open the Cypress application
```

Because the Lode application enforces [context isolation](https://www.electronjs.org/docs/tutorial/context-isolation#context-isolation), we are able to run renderer process without the need for Node.js APIs, and since Electron's API is access through the preload scripts using a centralized `Lode` object, we can easily mock their behavior for testing with Cypress.

If you're just getting started with Electron development, I would strongly recommend adhering to context isolation. Not only it's essential for a secure application, it also gives you a clear boundary for testing the main and renderer processes separately, as Lode does.

## License

Code is licensed under the [MIT license](LICENSE).

Usage of the software is bound to its own [terms and conditions](https://lode.run/terms/).
