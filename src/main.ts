////////////////// CSS Styles
import './assets/styles.scss';
//////////////////////////

import { createApp } from 'vue';
import { IonicVue } from '@ionic/vue';
import { App, AppPage, Storage, translate } from 'lib';

import AppMain from './App.vue';
import config from './config/environments/config';
import routes from './config/routes';
import http from './config/httpConfig';
import locales from './assets/translations/locales';
import packageJSON from '../package.json';
import initScrollReveal from './modules/scrollReveal';
import { autoSyncSteps } from './modules/healthSteps';
import '@fontsource-variable/inter';
import { autoPrefetch } from './modules/prefetch';
import { initBackButton } from './modules/backButton';
import { initTapHaptics } from './modules/haptics';
import grow from './directives/grow';
import AnimatedNumber from './components/animated-number/animated-number.vue';
import SkeletonBlock from './components/skeleton-block/skeleton-block.vue';
import CheckBadge from './components/check-badge/check-badge.vue';
//import baseComponent from './modules/baseComponent';

const savedLanguage = Storage.get('language');
const hasSavedLanguage = savedLanguage && Object.keys(locales.locales).includes(savedLanguage);
if (hasSavedLanguage) {
    locales.defaultLanguage = savedLanguage;
}

// Create APP
const app = createApp(AppMain);

// Initialize Phyrus
App.init(packageJSON.version, app, config, routes, locales);
app.component('AppPage', AppPage);
app.component('AnimatedNumber', AnimatedNumber);
app.component('SkeletonBlock', SkeletonBlock);
app.component('CheckBadge', CheckBadge);
app.directive('grow', grow);
// Ionic components (their CSS is loaded where they are used, so the current pages are not restyled)
app.use(IonicVue);

// translate.initialize() prioritizes the browser's language over defaultLanguage,
// so a saved preference must be re-applied explicitly to actually take over.
if (hasSavedLanguage) {
    translate.changeLanguage(savedLanguage);
}

// Descomenta para usar el baseComponent
// baseComponent(app);

// Initialize things here:
http();                         // HTTP Client configuration

// Mount app
app.mount('#app');
initScrollReveal();
autoSyncSteps();
autoPrefetch();
initTapHaptics();
initBackButton(app.config.globalProperties.$router);