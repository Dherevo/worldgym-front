<template>
    <div id="backoffice-layout">

        <div id="backoffice-top-menu" class="flex-row gap10" v-if="hasSlot('top')"
        :style="{
            height: topBarHeight+'px',
            flex: '0 0 '+topBarHeight+'px'
        }">
                <div class="logo">
                    <Burger v-if="WINDOW_WIDTH <= MOBILE_BREAKPOINT" v-model="burgerOpen" @change="burgerChange($event)"/>
                    <slot name="logo"/>
                </div>
                <slot name="top"/>
        </div>

        <div class="backoffice-flex" 

        :style="{
            height: 'calc(100vh - '+topBarHeight+'px)',
            flex: '1 1 auto'
        }">


            <div id="backoffice-content">

                <div id="backoffice-page-content">
                    <slot/>
                </div>
            </div>

        </div>
    </div>
</template>

<script lang="ts" src="./backoffice-layout.ts"></script>
<style lang="scss" src="./backoffice-layout.scss"></style>