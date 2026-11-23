<template>
  <AppSplash />
  <OfflineBanner />
  <router-view />
</template>

<script lang="ts">
// Traducciones de PrimeVue
import { usePrimeVue } from "primevue/config";
import locales from './assets/translations/locales';
import { defineComponent } from 'vue';
import AppSplash from '@/components/app-splash/app-splash.vue';
import OfflineBanner from '@/components/offline-banner/offline-banner.vue';

export default defineComponent({

  components: { AppSplash, OfflineBanner },

  created() {
    const primevue = usePrimeVue();
    if (locales.prime) {
      Object.keys(locales.prime).forEach((k: string) => {
        (primevue.config.locale as any)[k] = (locales.prime as any)[k];
      });
    }
  },
});
</script>