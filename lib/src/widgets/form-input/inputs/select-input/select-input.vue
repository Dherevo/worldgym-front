<template>
    <template v-if="!isReadonly()">
        <Select v-if="!suggestions && !multiple" 
            :placeholder="placeholder"
            appendTo="self"
            :modelValue="selectOption" 
            @change="updateValue($event.value)"
            v-bind="bindProps()"
            :disabled="disabled"
            :loading="loading"
            :options="getDropdownOptions()" 
            panelClass="form-input-select"
            @show="passEmit('open', $event)" 
            @hide="passEmit('close', $event)">
                <template #value="slotProps">
                    <div v-if="slotProps.value && !slotProps.value.component" v-safe-html="slotProps.value.content ? slotProps.value.content : slotProps.value.value"/>
                    <component v-else-if="slotProps.value && slotProps.value.component" :is="slotProps.value.component" v-bind="slotProps.value.props ? slotProps.value.props : {}" />
                    <div v-else v-safe-html="placeholder" />
                </template>
                <template #option="slotProps">
                    <div class="dropdown-option">
                    <div v-if="!slotProps.option.component" v-safe-html="slotProps.option.content ? slotProps.option.content : slotProps.option.value"/>
                    <component v-else :is="slotProps.option.component" v-bind="slotProps.option.props ? slotProps.option.props : {}"/>
                    </div>
                </template>
                <template #footer v-if="footer">
                    <component :is="footerComponent()" v-bind="footerProps()"/>
                </template>
            </Select>

        <MultiSelect v-if="multiple" 
            :modelValue="selectedOptions" 
            v-bind="bindProps()"
            @update:modelValue="updateValue($event)"
            optionLabel="content"
            :disabled="disabled"
            :loading="loading"
            :placeholder="placeholder"
            :options="getDropdownOptions()" 
            panelClass="form-input-select">
                <template #value>
                    {{ multiSelectValue() }}
                </template>
                <template #option="slotProps">
                    <div class="dropdown-option">
                    <div v-if="!slotProps.option.component" v-safe-html="slotProps.option.content ? slotProps.option.content : (slotProps.option.value ?? slotProps.option)"/>
                    <component v-else :is="slotProps.option.component" v-bind="slotProps.option.props ? slotProps.option.props : {}"/>
                    </div>
                </template>
                <template #footer v-if="footer">
                    <component :is="footerComponent()" v-bind="footerProps()"/>
                </template>
            </MultiSelect>

        <AutoComplete v-if="!multiple && suggestions" 
            :dropdown="true"
            v-model="selectOption" 
            :forceSelection="true"
            @input="updateValue($event.target.value)" 
            v-bind="bindProps()" 
            :disabled="disabled" 
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

    </template>
    <div v-else class="readonly-value">{{ readonlyValue() }}</div>
</template>

<script lang="ts" src="./select-input.ts"></script>
<style lang="scss" src="./select-input.scss"></style>