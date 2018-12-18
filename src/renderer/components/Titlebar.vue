<template>
    <div class="titlebar" :class="{ 'empty': !project }">
        <div v-if="project">
            <div class="titlebar-section">
                <div class="titlebar-dropdown closed" aria-expanded="false">
                    <div class="titlebar-button">
                        <button class="button-component" type="button">
                            <div class="text">
                                <div class="title">{{ project.name }}</div>
                            </div>
                            <Icon symbol="code" class="rotate-90" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'Toolbar',
    props: {
        project: {
            type: Object,
            default () {
                return false
            }
        }
    }
}
</script>
