<template>
    <div class="form-input" :class="getClass()">

        <template v-if="label && !['media','image','video'].includes(type)">
            <label v-if="['text', 
            'password',
            'email', 
            'number', 
            'search', 
            'checkbox', 
            'radio',
            'toggle',
            'textarea',
            'color'].includes(type)" 
            :for="inputName" 
            v-safe-html="getLabelContent()" />
            <span v-else class="label" v-safe-html="getLabelContent()" />
        </template>

        <TextInput v-if="['text', 'email', 'number'].includes(type)"
            ref="inputRef"
            @update:modelValue="setValue($event)"
            v-bind="filterProps()"
            :name="inputName"
            :min="min"
            :max="max"
            @pressEnter="passEmit('pressEnter')"
            @tabPressed="passEmit('tabPressed')"
            @pressEscape="passEmit('pressEscape')"
            @keyup="passEmit('keyup', $event)"
            @blur="passEmit('blur', $event)"
            @focus="passEmit('focus', $event)"
            @close="passEmit('close', $event)"
            @stop="passEmit('stop', $event)"/>

        <PhoneInput v-if="type == 'phone'"
            ref="inputRef"
            @update:modelValue="setValue($event)"
            @update:prefix="passEmit('update:prefix', $event)"
            @update:country="passEmit('update:country', $event)"
            @keyup="passEmit('keyup', $event)"
            @blur="passEmit('blur', $event)"
            @focus="passEmit('focus', $event)"
            v-bind="filterProps()"/>

        <SearchInput v-if="type == 'search'" 
            ref="inputRef"
            v-bind="filterProps()"
            :modelValue="modelValue"
            @update:modelValue="setValue($event)"
            @keyup="passEmit('keyup', $event)"
            @blur="passEmit('blur', $event)"
            @focus="passEmit('focus', $event)"
            @stop="passEmit('stop', $event)"
            @pressEnter="passEmit('pressEnter', $event)"/>

        <TextareaInput v-if="type == 'textarea'"
            ref="inputRef"
            :name="inputName"
            :max="max"
            @update:modelValue="setValue($event)"
            v-bind="filterProps()"
            @keydown.enter="passEmit('pressEnter')"
            @keydown.tab="passEmit('tabPressed')"
            @keyup="passEmit('keyup', $event)"
            @blur="passEmit('blur', $event)"
            @focus="passEmit('focus', $event)"
            @stop="passEmit('stop', $event)"/>

        <PasswordInput v-if="type == 'password'"
            ref="inputRef"
            :name="inputName"
            @update:modelValue="setValue($event)"
            @pressEnter="passEmit('pressEnter')"
            @keyup="passEmit('keyup', $event)"
            @blur="passEmit('blur', $event)"
            @focus="passEmit('focus', $event)"
            @stop="passEmit('stop', $event)"
            v-bind="filterProps()"/>

        <CheckboxInput v-if="type == 'checkbox'"
            ref="inputRef"
            @update:modelValue="setValue($event)"
            v-bind="filterProps()"/>

        <RadioInput v-if="type == 'radio'"
            ref="inputRef"
            @update:modelValue="setValue($event)"
            v-bind="filterProps()"/>

        <SwitchInput v-if="type == 'toggle'"
            ref="inputRef"
            :name="inputName"
            @update:modelValue="setValue($event)"
            v-bind="filterProps()"/>

        <ColorInput v-if="type == 'color'"
            ref="inputRef"
            :name="inputName"
            @update:modelValue="setValue($event)"
            v-bind="filterProps()"/>

        <SelectInput v-if="type == 'select'"
            ref="inputRef"
            @update:modelValue="setValue($event)"
            v-bind="filterProps()"/>

        <DateInput v-if="type == 'date'"
            ref="inputRef"
            @update:modelValue="setValue($event)"
            @blur="passEmit('blur', $event)"
            @focus="passEmit('focus', $event)"
            v-bind="filterProps()"/>

        <EditorInput v-if="type == 'editor'"
            ref="inputRef"
            @update:modelValue="setValue($event)"
            @stop="passEmit('stop', $event)"
            @keyup="passEmit('keyup', $event)"
            @blur="passEmit('blur', $event)"
            @focus="passEmit('focus', $event)"
            v-bind="filterProps()"/>

        <FileInput v-if="['media', 'image', 'video'].includes(type)"
            ref="inputRef"
            @update:modelValue="setValue($event)"
            @stop="passEmit('stop', $event)"
            v-bind="filterProps()"/>

        <label v-if="floatLabel" :for="inputName" style="pointer-events: none">{{floatLabel}}</label>

        <slot />

        <small class="form-input-help" :class="{floating: floatLabel}" v-if="help" v-safe-html="help" />
        <small class="red" v-if="error || localError">{{error || localError}}</small>
        
    </div>
</template>

<script lang="ts" src="./form-input.ts"></script>
<style lang="scss" src="./form-input.scss"></style>