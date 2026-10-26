<template>
    <div class="textimage" :style="{gap: gap?gap+'px':''}">
        <div v-if="!imageRight" class="image" :style="{
            'background-image': `url('${src}')`, 
            width: size?size+'px':'',
            height: size?size+'px':''
        }" :class="{round: roundImage}"/>
        <slot />
        <div v-if="text" v-safe-html="text" />
        <div v-if="imageRight" class="image" :style="{
            'background-image': `url('${src}')`,
            width: size?size+'px':'',
            height: size?size+'px':''
        }" :class="{round: roundImage}"/>
    </div>
</template>

<style>
.textimage {
    display: flex;
    align-items: center;
    gap: 7px;
}
.textimage .image {
    background-position: center;
    background-size: cover;
    background-repeat: no-repeat;
    width: 25px;
    height: 25px;
}
.textimage .image.round {
    border-radius: 50%;
}
</style>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    props: ['src', 'text', 'roundImage', 'imageRight', 'size', 'gap']
})
</script>
