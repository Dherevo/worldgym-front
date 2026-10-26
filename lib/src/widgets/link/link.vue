<template>
    <a class="v-link" :href="click ? undefined : getLink()" @click="falseLink($event)"
    :target="target ? target : undefined">
        <slot />
    </a>
</template>

<style lang="scss">
    .v-link {
        color: var(--primary-color);
        text-decoration: underline;
        cursor: pointer;
        max-width: 100%;
    }
</style>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({

    props: {
        href: {type: String},
        click: {type: Function},
        target: {type: String}
    },

    methods: {
        getLink() {
            if (!this.href) return;
            const middleware = (window as any)['LinkMiddleware'];
            if (middleware) {
                return middleware(this.href);
            }
            return this.href;
        },

        falseLink($e: any) {
            if (!this.href && !this.click) return;
            $e.preventDefault();
            if (this.click) this.click();
            else this.$router.push(this.getLink());
        }
    }
});
</script>