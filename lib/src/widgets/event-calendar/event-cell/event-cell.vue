<template>
    <div class="cell event-cell"
    :class="{'occupied-cell': getEvents(day).length > 0, 'bullet-events': bulletEvents}"
    :style="{'flex-direction' : direction ? direction : 'column'}">

        <div v-if="mode == 'month'" class="day-number">
            <span>{{ day.dayNumber }}</span>
            <svg-icon v-if="addOnHover && getEvents(day).length > 0" 
                @click="handleEmptyCell()" class="add-icon" name="prime/plus-circle"/>
        </div>

        <div v-if="(emptyCell || addOnHover) && 
        getEvents(day).length == 0" class="empty-cell"
        @click="handleEmptyCell()">
            <svg-icon v-if="addOnHover" class="add-icon" name="prime/plus-circle"/>
        </div>

        <div v-if="addOnHover && addIconBelow &&
        getEvents(day).length > 0" class="below-button">
            <div @click="handleEmptyCell()">
                <svg-icon v-if="addOnHover" class="add-icon" name="prime/plus-circle"/>
            </div>
        </div>
        
        <event-box v-for="(event, index) in getEvents(day)" :key="index" :event="event" 
        :displayInterval="displayInterval" :bulletEvents="bulletEvents" :positionEvents="positionEvents"/>
    </div>
</template>

<style lang="scss" src="./event-cell.scss"></style>
<script lang="ts" src="./event-cell.ts"></script>