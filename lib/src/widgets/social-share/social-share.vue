<template>
    <div class="social-share" v-if="networks">

        <a v-for="(obj, name) in networks" :key="name" :class="name" target='_blank' :href="shareLink(name, obj)">
            <div class="icon" :style="{'background-color': obj.background ? colorFor(name, obj, true) : ''}" :class="{'social-box': obj.background}">
                <svg-icon :name="obj.icon ? obj.icon : 'awesome-brands/' + iconFor(name)"
                :style="{color: colorFor(name, obj), fill: colorFor(name, obj)}" />
            </div>

            <div v-if="obj.text">{{ obj.text }}</div>
        </a>

    </div>
</template>

<script lang="ts" src="./social-share.ts"></script>
<style lang="scss" src="./social-share.scss"></style>