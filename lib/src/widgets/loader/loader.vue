<template>
    <div class="loader-container">
        <div class="loader" :style="generateStyle()"></div>
        <label v-if="label">{{ label }}</label>
    </div>
</template>

<style>
.loader-container {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 50px 0;
    gap: 20px;
}

.loader {
  border: 3px solid var(--primary-color);
  border-top: 2px solid transparent;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>

<script lang="ts" src="./loader.ts"></script>