<template>
    <div v-if="!imageError" class="circle-image" :style="imageStyle()"></div>
    <PrimeAvatar v-else :style="avatarStyle()" shape="circle" :label="letter"/>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import Avatar from 'primevue/avatar';

const avatarColors = [
  "#C0C0C0", // Light Gray
  "#C0DDF0", // Light Blue
  "#A2D8A6", // Green
  "#E6A9A9", // Red
  "#F0C4A7", // Orange
  "#D3B8E0", // Desaturated Purple
  "#D2B48C"  // Brown (Tan)
];

export default defineComponent({

    components: { PrimeAvatar: Avatar },

    props: {
        size: {
            default: 40
        },
        src: {
            required: true
        },
        name: {
            type: String,
            required: true
        }
    },

    data() {
        const data : {
            imageError: boolean,
            letter: string
        } = {
            imageError: true,
            letter: ''
        }

        return data;
    },

    created() {
        this.loadImage();
        this.letter = this.name.charAt(0).toUpperCase();
    },

    methods: {

        loadImage() {
            if (this.src == '') return;

            const img = new Image();
            img.onload = () => {
                this.imageError = false;
            }
            img.onerror = () => {
                this.imageError = true;
            }
            img.src = this.src;
        },

        imageStyle() {

            const style : any = {
                'background-image': "url('"+ this.src +"')"
            };
    
            if (this.size) {
    
                style['width'] = this.size + 'px';
                style['min-width'] = this.size + 'px';
                style['height'] = this.size + 'px';
    
            }
    
            return style;
        },

        avatarStyle() {
            const style : any = {
                background: avatarColors[Math.floor(Math.random() * avatarColors.length)]
            };
    
            if (this.size) {
    
                style['width'] = this.size + 'px';
                style['min-width'] = this.size + 'px';
                style['height'] = this.size + 'px';
    
            }
    
            return style;
        }
    }

})
</script>