<template>
<div class="event-calendar" :class="'mode-' + (mode ? mode : 'week')">

    <div class="header" v-if="mode == 'day'">
        {{ dayTitle() }}
    </div>

    <div className="header flex-row gap5" v-if="['month', 'week', undefined].includes(mode)">
        <div className="flex-grow">{{ monthTitle() }} {{ yearTitle() }}</div>

        <div className="controls flex-row gap5">
            <Btn @click="() => previous()">
                <svg-icon name="prime/chevron-left" />
            </Btn>
            <Btn @click="() => next()">
                <svg-icon name="prime/chevron-right" />
            </Btn>
        </div>
    </div>

    <div v-if="(!mode || mode == 'week') && getWeekDays()">

        <div class="row">
            <div class="col-auto cell" />

            <div class="col cell" :class="{ today: day.time.date() == today }" v-for="(day, name) in getWeekDays()"
                :key="name">
                <div class="day-name">{{ day.time.dayName }}</div>
                <div class="day-number">{{ day.time.format('DD') }}</div>
            </div>
        </div>

        <div class="row" v-for="(hour, hourname) in getDisplayHours()" :key="hourname">

            <div class="col-auto cell hour-cell">
                <span>{{ hour.number }}:00</span>
            </div>

            <event-cell class="col" :class="{ today: day.time.date() == today }"
                v-for="(day, dayindex) in getWeekDays()" :key="dayindex" :day="day" :emptyCell="emptyCell"
                :addOnHover="addOnHover" :hour="hour" :hourname="hourname" direction="column"
                :displayInterval="displayEventInterval" :bulletEvents="bulletEvents"
                :positionEvents="positionEvents" :addIconBelow="true" />

        </div>

    </div>

    <div v-if="mode == 'day' && getDay()">

        <div class="row" v-for="(hour, hourname) in getDisplayHours()" :key="hourname">

            <div class="col-auto cell hour-cell">
                <span>{{ hour.number }}:00</span>
            </div>

            <event-cell class="col" :day="getDay()" :emptyCell="emptyCell" :addOnHover="addOnHover" :hour="hour"
                :hourname="hourname" direction="row" :displayInterval="displayEventInterval"
                :bulletEvents="bulletEvents" :positionEvents="positionEvents" />

        </div>

    </div>

    <div v-if="mode == 'month'">

        <div class="flex-row day-cells">

            <div class="flex-grow cell month-day day-name" v-for="(dayname, index) in daynames()" :key="index">
                {{ dayname }}
            </div>

        </div>
        <div class="day-cells">

            <div class="flex-row" v-for="(group, index) in groupOfSeven()" :key="index">

                <event-cell class="col-7 month-day"
                    :class="{ outer: !_monthDays[index].same, today: _monthDays[index].time.date() == today }"
                    :emptyCell="emptyCell" :addOnHover="addOnHover" :day="_monthDays[index]" :mode="mode"
                    :hour="{ number: '12' }" :displayInterval="displayEventInterval" :bulletEvents="bulletEvents"
                    :positionEvents="positionEvents">
                    <span class="day-tag">{{ _monthDays[index].dayNumber }}</span>

                    <event-box v-for="(ev, i2) in _monthDays[index].events" :key="i2" :event="ev"
                        :displayInterval="displayEventInterval" :bulletEvents="bulletEvents"
                        :positionEvents="positionEvents" />
                </event-cell>

            </div>

        </div>

    </div>

</div>
</template>

<script lang="ts" src="./event-calendar.ts"></script>
<style lang="scss" src="./event-calendar.scss"></style>