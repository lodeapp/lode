<template>
    <span class="spinner">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="25px" height="25px" viewBox="2 2 40 40">
            <g fill="none" fill-rule="evenodd">
                <g transform="translate(1 1), scale(0.85)">
                    <circle cx="18" cy="18" r="18" stroke="#999" stroke-opacity="0.4" stroke-width="4" />
                    <path d="M36 18c0-9.94-8.06-18-18-18" stroke="#999" stroke-opacity="0.9" stroke-width="4">
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 18 18"
                            to="360 18 18"
                            dur="0.5s"
                            repeatCount="indefinite"/>
                    </path>
                </g>
            </g>
        </svg>
    </span>
</template>

<script>
export default {
    name: 'Spinner'
}
</script>
