<template>
    <slot/>
</template>

<script lang="ts">
import { defineComponent } from "vue";

// AppPage passes the `page` prop to every layout
export default defineComponent({ props: { page: Function } });
</script>
