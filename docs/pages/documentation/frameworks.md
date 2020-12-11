---
pageClass: documentation
title: Testing Frameworks
sidebarDepth: 3
---

# Testing Frameworks

You can add as many projects and repositories as you want, but testing frameworks are limited because Lode needs to understand what it should run and how. The following sections will guide you through what's required to make your testing workflow work in Lode.

The following frameworks are supported by Lode:
- PHPUnit
- Jest

If you'd like to see another framework supported [contact us](mailto:info@recontra.co).

## Adding frameworks to Lode

In order to add testing frameworks to your repositories in Lode, you will have to trigger a scan.

A scan can be triggered upon adding a new repository:

<span class="image-wrapper resize-75">
    <img src="/documentation/light-mac--add-repositories.png" alt="Screenshot showing how to trigger scanning for framework automatically when adding a repository.">
</span>

Alternatively, you can right-click over an existing repository in the sidebar, then select "Scan for Frameworks…"

<span class="image-wrapper resize-50">
    <img src="/documentation/light-mac--scan-frameworks-from-context-menu.png" alt="Screenshot showing how to trigger framework scan in macOS.">
</span>

## Scanning strategies

Lode will try to parse your repository to understand what testing frameworks are available for it. It has different scanning strategies for each framework, so if Lode doesn't pick up on a supported framework, make sure to read that framework's "Scanning strategies" section and see if there is something that can be done to correct it.

- [PHPUnit scanning strategies](/documentation/frameworks.html#phpunit-scanning-strategies)
- [Jest scanning strategies](/documentation/frameworks.html#jest-scanning-strategies)

You can also suggest improvements in scanning strategies by [contacting us](/documentation/support.html#contact-us).

## Adding frameworks manually

It is currently not possible to add frameworks manually to your repositories in Lode. We hope to change this very soon.

## Managing frameworks

Upon finding frameworks in a repository scan, or at any point when you choose to manage existing frameworks in a repository, you will see the "Manage test frameworks" screen. It will show a list of found/pending frameworks (i.e. after a scan), of existing frameworks, or even of frameworks that were added at a given point and can no longer be found by Lode (they will be flagged as "removed").

<span class="image-wrapper resize-75">
    <img src="/documentation/light-mac--single-framework-scan-result.png" alt="Screenshot showing the results of a framwork scan.">
</span>

After you edit a framework's settings you must click on "Save changes", otherwise the changes will not take effect.

## Understanding framework settings

The following settings can be set for each of your frameworks.

|Setting|Required|What it does|
|-------|:------:|------------|
|Name|Yes|Allows you to customize your framework's name inside Lode
|Framework|Yes|Which testing framework this is.
|Command|Yes|What binary command should Lode run in order to execute the testing framework.
|Tests path|No|If all of your tests are inside a given path, specifying it here will make Lode hide that path when displaying the test file paths in the list
|Runs in remote machine|Yes|Whether the framework is run in a remote machine (e.g. Vagrant or Docker). You must specify this, even if you don't set any of the remote machine configurations, otherwise Lode will not be able to properly transform your framework's results.
|Remote repository path|No|Much like "Tests path" above, specifying this will make Lode understand which portions of a file path are irrelevant and should be hidden.
|SSH settings|No|If Lode needs to use SSH to connect to the remote machine, specify which settings it should use.

::: warning NOTE
**Commands are not executed by a shell**, which means it doesn't support variables nor will it use any aliases defined in your shell environment. If you need more flexibility, you can write your own shell script.
:::

## Running locally

If a test framework in your repository runs on your local machine, setup is much easier. In most cases, the default command will do. Transformation of the results occurs directly inside of Lode and no changes in your repository should be necessary.

## Running in remote machines

Lode can also run tests inside remote machines, as long as you instruct it how it should connect. This can be done in Lode's framework settings, or -- since Lode will merely execute a given script -- using a custom executable file with all required settings (for maximum flexibility).

::: warning
In order to process test results from remote machines, Lode will temporarily inject its reporters into the parent repository and remove them once testing is concluded. It is nevertheless highly recommended that you add the `.lode` folder to your `.gitignore` file or equivalent.
:::

### Vagrant / Homestead

In order to run testing frameworks inside of a Vagrant machine, make sure to configure the SSH settings in your "Framework Settings" menu with all the same parameters that the `vagrant ssh` command would use. For example, here are some common settings:

|Setting|Value|
|-------|-----|
|SSH Host|127.0.0.1
|SSH User|vagrant
|SSH Port|2222
|Identity file|(Leave blank)

::: tip
If you are unsure what your settings are, running `vagrant up && vagrant ssh-config` should print them on the command-line.
:::

Since Laravel Homestead uses Vagrant, the above should work for your Laravel's PHPUnit suite, too.

### Docker

Since Docker is extremely flexible, your mileage may vary. But assuming you have a `test` command in your tests container, something like this could do the trick: `docker exec mymachine test`. Just remember to omit flags like `--interactive`, `-i`, `--tty`  and `-t`.

## Running in custom environments

For custom environments that are not like what's described above, a solution might be to create a custom shell script and use that as the Lode command. Whatever that command does, though, it is very important that it supports the passing of parameters. Testing framework executables make use of parameters to customise runs, and Lode's features like running tests selectively depend on being able to pass them. In practice this means that your custom `mycommand.sh` could look something like this (note the use of `"$@"`).

```bash
#!/usr/bin/env bash

./vendor/bin/phpunit "$@"
```

:::warning NOTE
Lode does not run interactive commands.
:::

## PHPUnit

Lode supports various versions of PHPUnit and provides a number of advantages over the native command-line interface. You will be able to see results in real-time, with current running files marked as such, and any errors or exceptions will be visible as soon as they happen with diffs and traces, if available.

There are also a number of refinements built specifically for Laravel assertions, with many more coming soon. (We love Laravel.)

### Supported PHPUnit versions

The following table represents the assessed support in our latest testing rounds.

|PHPUnit Version|Support|
|---------------|-------|
|8.0 or later|Full
|7.0 or later|Full
|6.0 or later|Full
|5.7 or later|Full
|5.0 or later|Partial
|4.8 or later|Partial

Please ensure you have the latest stable version of a major release before trying out Lode. Note that support is tentative, as we cannot guarantee that all testing conditions will work with Lode out-of-the-box. If you think something should be working and isn't, [contact us](mailto:info@recontra.co).

### PHPUnit scanning strategies

In order for Lode to discover PHPUnit in your repository, it must meet one of these two conditions:
1) Have a `phpunit.xml` or `phpunit.xml.dist` file in the repository's root folder
2) Have the `phpunit/phpunit` Composer dependency installed, with `vendor/bin/phpunit` executable available

## Jest

The following table represents the assessed support in our latest testing rounds.

|Jest Version|Support|
|------------|-------|
|24.0 or later|Full
|23.0 or later|Full
|22.0 or later|Full

Please ensure you have the latest stable version of a major release before trying out Lode. Note that support is tentative, as we cannot guarantee that all testing conditions will work with Lode out-of-the-box. If you think something should be working and isn't, [contact us](mailto:info@recontra.co).

### Jest scanning strategies

In order for Lode to discover Jest in your repository, it must meet one of these two conditions:
1) Have a script declaration in your `package.json` that executes jest, like the following example:

```json
{
    "scripts": {
        "test": "jest"
    }
}
```

2) As a fallback, have a `jest` property with Jest settings in your `package.json` (although this will likely require you to configure Lode's Jest settings manually, as the default ones will likely fail)

### Known limitations for Jest

1) When listing tests, Jest only returns the parent suites. Therefore, individual tests are only known after first run, but will subsequently be remembered by Lode.
2) Lode cannot run individual Jest tests selectively because the Jest CLI does not support it. Instead, running Jest test selectively is done in the test code itself by using the `describe.only` or `it.only` (or `test.only`) methods, like in the following example:

```js
describe('Describe test', () => {
    it.only('Runs selectively', () => {
        // ...
    })
    it('Is skipped', () => {
        // ...
    })
})
```
