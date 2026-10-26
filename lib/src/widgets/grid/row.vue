<template>
    <div class="row" :class="{'row-padding': space !== undefined, 'stretch': stretch !== undefined}"><slot/></div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
    props: ['space', 'stretch']
})
</script>
