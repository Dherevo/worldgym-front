<template>
    <AppPage name="users-page" layout="backoffice">
        <div id="users-page">

            <h1>POR FAVOR BORRA ESTA CARPETA, ES SOLO DE EJEMPLO</h1>

            <FormInput type="search" 
            v-model="table.filters.search" 
            placeholder="Buscar..."
            @stop="table.refresh()"/>
            <br />
            
            <AppTable :table="table">

                <!-- COLUMNA NOMBRE -->
                <template #col-name="{ item }">
                    <div class="flex-row gap10">
                        <Avatar :src="item.image" :name="item.name"/>
                        <img v-if="false" class="circular" style="width:30px;height:30px" :src="item.image" />
                        <div>
                            <div><b>{{ item.fullName }}</b></div>
                            <div><small>{{ item.email }}</small></div>
                        </div>
                    </div>
                </template>

                <!-- COLUMNA DEPARTAMENTO -->
                <template #edit-department="{ item, value, setValue }">
                    <select :value="value" @change="setValue($event.target?.value)">
                        <option v-for="(d, k) in $t('department')" :key="k" :value="k">
                            {{ d }}
                        </option>
                    </select>
                </template>

                <template #search-department="{ col, search }">
                    <select v-model="table.filters.department" @change="search.complete()">
                        <option value="all">{{ $t('generic.all') }}</option>
                        <option v-for="(d, k) in $t('department')" :key="k" :value="k">
                            {{ d }}
                        </option>
                    </select>
                </template>

                <!-- COLUMNA ESTADO -->
                <template #col-status="{ item }">
                    <Tag rounded :severity="
                        item.status == 'active' ? 'success' : 
                        (item.status == 'waiting' ? 'info' : 'danger')
                    ">{{ $t('status.' + item.status) }}</Tag>
                </template>

                <template #edit-status="{ item }">
                    <select v-model="item.status">
                        <option v-for="(d, k) in $t('status')" :key="k" :value="k">
                            {{ d }}
                        </option>
                    </select>
                </template>

            </AppTable>
        </div>
    </AppPage>
</template>

<script lang="ts" src="./users.ts"></script>
<style lang="scss" src="./users.scss"></style>