<template>
    <div :class="getClasses()"><slot/></div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
    props: ['col', 'xs', 'sm', 'md', 'lg'],

    methods: {
        getClasses() {
            const obj = {
                col: true
            }

            if (this.col) {
                obj['col-' + this.col] = true;
            }

            if (this.xs) {
                obj['col-xs-' + this.xs] = true;
            }

            if (this.sm) {
                obj['col-sm-' + this.sm] = true;
            }

            if (this.md) {
                obj['col-md-' + this.md] = true;
            }

            if (this.lg) {
                obj['col-lg-' + this.lg] = true;
            }

            return obj;
        }
    }
})
</script>
