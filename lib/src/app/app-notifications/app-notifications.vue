<template>
    <transition-group class="app-notifications" name="p-message" tag="div" v-if="notifications && notifications.length > 0">
        <Message v-for="notification of notifications" :key="notification.id" 
        class="notification"
        :class="classForElement(notification)"
        :severity="notification.type"
        :closable="notification.closable"
        @close="closeNotification(notification)">

            <div v-if="notification.text" class="flex-row gap10">
                <div v-safe-html="notification.text" />

                <template v-if="notification.buttons && notification.buttons.length > 0">
                    <btn v-for="(btn, index) in notification.buttons" :key="index" @click="btn.onClick()"
                    :disabled="btn.disabled" :loading="btn.loading" :class="btn.class" :style="btn.style">
                        <svg-icon v-if="btn.icon && btn.iconPosition != 'right'" :name="btn.icon" />
                        <div>{{ btn.content }}</div>
                        <svg-icon v-if="btn.icon && btn.iconPosition == 'right'" :name="btn.icon" />
                    </btn>
                </template>
            </div>

            <component v-if="notification.component" :is="notification.component" v-bind="$utils.isFunction(notification.props) ? notification.props() : notification.props"/>
        </Message>
    </transition-group>
</template>

<script lang="ts" src="./app-notifications.ts"></script>
<style lang="scss" src="./app-notifications.scss"></style>