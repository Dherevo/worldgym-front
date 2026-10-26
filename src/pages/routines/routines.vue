<template>
    <AppPage name="routines-page" layout="backoffice">
        <div class="routines-page">

            <div class="page-header">
                <h1>Rutines</h1>
                <button class="btn-primary" @click="openCreate()">+ Nova rutina</button>
            </div>

            <div v-if="loading" class="loading-text">Carregant...</div>
            <div v-else-if="routines.length === 0" class="empty-text">No tens cap rutina. Crea-ne una!</div>
            <div v-else class="routine-list">
                <div v-for="r in routines" :key="r.id" class="routine-card" :class="{ 'is-default': r.is_default }">
                    <div class="routine-info" @click="to('/routines/' + r.id)">
                        <div class="routine-name">
                            {{ r.name }}
                            <span class="badge default" v-if="r.is_default">Per defecte</span>
                        </div>
                        <div class="routine-desc" v-if="r.description">{{ r.description }}</div>
                        <span class="badge global" v-if="r.is_global">Global</span>
                    </div>
                    <div class="routine-actions">
                        <button @click="to('/routines/' + r.id)">Veure</button>
                        <button @click="openEdit(r)">Editar</button>
                        <button v-if="!r.is_default" @click="setDefault(r)">Fer per defecte</button>
                        <button class="danger" @click="deleteRoutine(r)">Eliminar</button>
                    </div>
                </div>
            </div>

            <!-- Form Modal -->
            <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
                <div class="modal">
                    <h2>{{ editingRoutine ? 'Editar rutina' : 'Nova rutina' }}</h2>

                    <div class="form-group">
                        <label>Nom *</label>
                        <input type="text" v-model="form.name" placeholder="Nom de la rutina" />
                    </div>
                    <div class="form-group">
                        <label>Descripció</label>
                        <textarea v-model="form.description" rows="2" placeholder="Descripció opcional"></textarea>
                    </div>

                    <div class="form-actions">
                        <button class="btn-cancel" @click="showForm = false">Cancel·lar</button>
                        <button class="btn-primary" @click="save()" :disabled="saving">
                            {{ saving ? 'Desant...' : 'Desar' }}
                        </button>
                    </div>
                </div>
            </div>

        </div>
    </AppPage>
</template>

<script lang="ts" src="./routines.ts"></script>
<style lang="scss" src="./routines.scss"></style>
