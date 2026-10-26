<template>
    <div class="searchbar" v-if="!isReadonly()">
        <AutoComplete
        ref="input"
        v-model="selectOption" 
        @input="updateValue($event.target.value)" 
        v-bind="bindProps()" 
        :disabled="isDisabled()" 
        :placeholder="placeholder"
        :suggestions="previousSuggestions"
        @item-select="suggestionSelected($event.value.value)"
        optionLabel="content"
        :optionGroupLabel="undefined" 
        optionGroupChildren="items"
        @blur="passEmit('blur', modelValue)"
        @focus="passEmit('focus', modelValue)"
        @keydown="passEmit('keydown', modelValue)"
        @keydown.enter="submit()"
        @dropdown-click="passEmit('open', modelValue)" 
        @hide="onCloseSuggestions()">
            <template #optiongroup="slotProps">
                <div v-if="!slotProps.item.component" v-safe-html="slotProps.item.content ? slotProps.item.content : slotProps.item.value"/>
                <component v-else :is="slotProps.item.component" v-bind="slotProps.item.props ? slotProps.item.props : {}"/>
            </template>
            <template #option="slotProps">
                <div v-if="!slotProps.option.component" v-safe-html="slotProps.option.content ? slotProps.option.content : slotProps.option.value"/>
                <component v-else :is="slotProps.option.component" v-bind="slotProps.option.props ? slotProps.option.props : {}"/>
            </template>
        </AutoComplete>
        <svg-icon name="prime/search" class="search-icon" @click="submit()"/>
    </div>
</template>

<script lang="ts" src="./search-input.ts"></script>
<style lang="scss" src="./search-input.scss"></style>