////////////////// CSS Styles
import './assets/styles.scss';
//////////////////////////

import { createApp } from 'vue';
import { App, AppPage } from 'lib';

import AppMain from './App.vue';
import config from './config/environments/config';
import routes from './config/routes';
import http from './config/httpConfig';
import locales from './assets/translations/locales';
import packageJSON from '../package.json';
//import baseComponent from './modules/baseComponent';

// Create APP
const app = createApp(AppMain);

// Initialize Phyrus
App.init(packageJSON.version, app, config, routes, locales);
app.component('AppPage', AppPage);

// Descomenta para usar el baseComponent
// baseComponent(app);

// Initialize things here:
http();                         // HTTP Client configuration

// Mount app
app.mount('#app');