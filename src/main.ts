////////////////// CSS Styles
import './assets/styles.scss';
//////////////////////////

import { createApp } from 'vue';
import { App, AppPage, Storage, translate } from 'lib';

import AppMain from './App.vue';
import config from './config/environments/config';
import routes from './config/routes';
import http from './config/httpConfig';
import locales from './assets/translations/locales';
import packageJSON from '../package.json';
import initScrollReveal from './modules/scrollReveal';
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