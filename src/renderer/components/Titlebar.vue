<template>
    <div class="titlebar" :class="[`status--${project.status}`]">
        <div class="titlebar-section">
            <div class="titlebar-dropdown closed" aria-expanded="false">
                <div class="titlebar-button">
                    <button class="button-component" type="button">
                        <div class="text">
                            <div class="title">Amiqus ID</div>
                        </div>
                        <Icon symbol="code" class="rotate-90" />
                    </button>
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
            required: true
        }
    }
}
</script>
