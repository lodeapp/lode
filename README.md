# [Lode](https://lode.run)

Lode is an open source [Electron](https://electronjs.org/)-based
universal test runner graphical user interface. It is written in [TypeScript](http://www.typescriptlang.org) and [Vue](https://vuejs.org/).

![Lode screenshot - macOS](https://lode.run/github-screenshot.png)

## Getting started

You can download the latest pre-packaged version [here](https://lode.run/) or choose a version from the [releases](https://github.com/lodeapp/lode/releases) page.

To run it locally, you must first clone this repository and run the following commands:

```sh
yarn install
yarn dev
```

Afterwards, to build the application for the current platform, run the following:

```sh
yarn build
```

Alternative, you can build the application in development mode to include the Development menu and Chrome's dev tools, which makes it a bit slower:

```sh
yarn build:dev
```

For other building options, refer to the [package.json](/package.json) scripts.

## Supported Frameworks

Lode currently supports the following testing frameworks:

- [PHPUnit](https://lode.run/documentation/frameworks.html#phpunit)
- [Jest](https://lode.run/documentation/frameworks.html#jest)

For more information, see each specific framework's section in [this page](https://lode.run/documentation/frameworks.html).

## Documentation

See [lode.run](https://lode.run/documentation/) for instructions on how to use the software.

## License

Code is licensed under the [MIT license](LICENSE).

Usage of the software is bound to its own [terms and conditions](https://lode.run/terms/).
