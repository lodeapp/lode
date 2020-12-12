<template>
    <div class="theme-container simple clearfix">
        <header>
            <div class="container-new py-5 px-3 text-center">
                <RouterLink to="/" class="logo">
                    <img :src="$withBase('/logo.svg')" alt="Lode icon">
                </RouterLink>
            </div>
        </header>

        <Content :class="$frontmatter.pageClass" />

        <hr class="my-6 mx-auto col-md-3">

        <div class="mx-auto text-center">
            <ul class="nav list-style-none d-flex flex-justify-center f4 flex-column flex-lg-row">
                <li class="d-inline-block my-2 mx-4">
                    <RouterLink to="/">Overview</RouterLink>
                </li>
                <li class="d-inline-block my-2 mx-4">
                    <RouterLink to="/documentation/">Documentation</RouterLink>
                </li>
                <li class="d-inline-block my-2 mx-4">
                    <RouterLink to="/release-notes/">Release Notes</RouterLink>
                </li>
                <li class="d-inline-block my-2 mx-4">
                    <RouterLink to="/terms/">Terms &amp; Conditions</RouterLink>
                </li>
            </ul>
        </div>
        <footer class="my-4 px-3 text-center">
            <small>&copy; 2018 &mdash; {{ new Date().getFullYear() }} Tomas Buteler. All rights reserved.</small>
        </footer>

        <Cookies />
    </div>
</template>
