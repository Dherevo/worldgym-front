<template>
    <div class="event-box"
        :style="styleForBox()"
        :class="{clickable: event.onClick || event.popup, bulletEvent: bulletEvents}"
        @click="handleClick(event)">

        <div class="mask" :style="{
            'background-color': event.color,
            'border-radius': bulletEvents ? '10px' : '3px'
        }"/>

        <div class="popup" v-if="event.popup && event.popupVisible > 0"
            :class="{full: event.popupVisible == 2}">
            <div v-if="event.popup.content" v-safe-html="event.popup.content()" />
            <component v-if="event.popup.component" :is="event.popup.component"
            v-bind="event.popup.props ? event.popup.props : {}" />
        </div>

        <div class="event-content" :style="{color: event.color}">

            <div class="event-time flex-row" v-if="!bulletEvents">

                <div class="event-actions flex-row">
                    <a class="btn" v-if="event.meet" 
                    :href="event.meet" target="_blank"
                    :style="{background: event.color}">
                        <svg-icon name="prime/video"/>
                    </a>

                    <a class="btn" v-if="event.link"
                    :href="event.link" target="_blank"
                    :style="{background: event.color}">
                        <svg-icon name="prime/link"/>
                    </a>
                </div>

                <div>{{ timeLabel() }}</div>
            </div>

            <div class="event-label flex-row">
                <span class="bullet-indicator" v-if="bulletEvents" :style="{'background-color': event.color}"/>
                <span class="event-text flex-row">
                    <span class="time" v-if="bulletEvents">{{ event.date.time() }}</span>
                    <span class="lines1" v-safe-html="event.text"/>
                </span>
            </div>
        </div>

    </div>
</template>

<style lang="scss" src="./event-box.scss"></style>
<script lang="ts" src="./event-box.ts"></script>