<template>
    <template v-if="!isReadonly()">

    <InputNumber v-if="type == 'number'" 
        :modelValue="modelValue" 
        @input="updateValue($event.value)" 
        v-bind="bindProps()"
        :disabled="isDisabled()"
        ref="input"
        fluid
        :inputId="name"
        @keydown.enter="passEmit('pressEnter')"/>

    <InputMask v-else-if="mask" 
        :modelValue="modelValue" 
        @update:modelValue="updateValue($event)" 
        v-bind="bindProps()"
        :disabled="isDisabled()"
        :mask="mask"
        @complete="passEmit('complete', modelValue)"
        @blur="passEmit('blur', $event)"
        @focus="passEmit('focus', $event)"
        :id="name"
        ref="input"/>

    <AutoComplete v-else-if="suggestions" 
        ref="input"
        :inputId="name"
        :dropdown="false"
        v-model="selectOption" 
        :forceSelection="false"
        @input="updateValue($event.target.value)" 
        v-bind="bindProps()" 
        :disabled="isDisabled()" 
        :placeholder="placeholder"
        :suggestions="previousSuggestions"
        @item-select="suggestionSelected($event.value)"
        optionLabel="content"
        :optionGroupLabel="undefined" 
        optionGroupChildren="items"
        @dropdown-click="onOpenSuggestions()" 
        @hide="onCloseSuggestions()"
        @blur="passEmit('blur', modelValue)"
        @focus="passEmit('focus', modelValue)">
            <template #optiongroup="slotProps">
                <div v-if="!slotProps.item.component" v-safe-html="slotProps.item.content ? slotProps.item.content : slotProps.item.value"/>
                <component v-else :is="slotProps.item.component" v-bind="slotProps.item.props ? slotProps.item.props : {}"/>
            </template>
            <template #option="slotProps">
                <div v-if="!slotProps.option.component" v-safe-html="slotProps.option.content ? slotProps.option.content : slotProps.option.value"/>
                <component v-else :is="slotProps.option.component" v-bind="slotProps.option.props ? slotProps.option.props : {}"/>
            </template>
        </AutoComplete>

        <InputText v-else="!mask" 
        :modelValue="modelValue" 
        @input="updateValue($event.target.value)" 
        v-bind="bindProps()"
        :disabled="disabled"
        @keydown.enter="passEmit('pressEnter')"
        @keydown.tab="passEmit('tabPressed')"
        @keydown.esc="passEmit('pressEscape')"
        @keyup="passEmit('keyup', $event)"
        @blur="passEmit('blur', $event)"
        @focus="passEmit('focus', $event)"
        :autocomplete="autocomplete"
        :name="name"
        :type="type"
        :id="name"
        ref="input"/>

    </template>
    <div v-else class="readonly-value">{{ modelValue }}</div>
</template>

<script lang="ts" src="./text-input.ts"></script>
<style lang="scss" src="./text-input.scss"></style>