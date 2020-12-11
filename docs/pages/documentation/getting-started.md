---
pageClass: documentation
title: Getting Started
---

# Getting started

To start using Lode, make sure you've downloaded the latest version for your platform. We currently support macOS only, but Window and Linux are coming soon.

::: warning NOTE
Lode requires you to have a fully working testing framework before it can render results (i.e. testing framework's dependencies must be installed in your project on running environment and the required configurations properly set). **Lode does not set up testing frameworks, it merely runs existing ones and parses their results.**
:::

## Adding your first project

Upon starting for the first time, you will be prompted to create your first project. Lode organizes testing in the following groups:

Projects → Repositories → Testing Frameworks

You can have unlimited projects, and inside each project unlimited repositories.

After you give your first project a name (naming projects is required), click on the "Add Project" button.

<span class="image-wrapper resize-75">
    <img src="/documentation/light-mac--add-first-project.png" alt="Screenshot showing how to add your first project.">
</span>

You'll then be prompted to add repositories. You can add multiple repositories at once in this screen. Just click the "Add another repository" button to add another path input, or select multiple directories after clicking "Choose" on any existing path input row.

<span class="image-wrapper resize-75">
    <img src="/documentation/light-mac--add-repositories.png" alt="Screenshot showing how to repositories to a Lode project.">
</span>

After your repositories have been added, they will show as "empty". This is because they start out without any testing frameworks. The easiest way to add frameworks to them is to check the "Scan repositories for frameworks after adding" checkbox -- this will automatically trigger a scan and show you a modal of whatever is found. Check that settings match your frameworks configurations, click the "Save changes" button and you're done!

When added, the framework will automatically trigger the running command and show you the available tests. If the command returns an error, it will be shown to you. The [Testing Frameworks](/documentation/frameworks.html) section goes into detail on how to manage each framework and what to consider for different running environments.
