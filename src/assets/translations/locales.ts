import ca from "./ca"
import es from "./es"
import en from "./en"

// Moment:
import momentCA from "../../../lib/moment-locales/ca";
import momentES from "../../../lib/moment-locales/es";

// Prime:
import primeCA from "primelocale/ca.json";
import primeES from "primelocale/es.json";
import primeEN from "primelocale/en.json";

const primeByLanguage: Record<string, any> = { ca: primeCA, es: primeES, en: primeEN };

// Same preference main.ts applies (Storage.set('language', ...)); read directly here because
// PrimeVue's texts are merged from this file, before the translation engine is initialized.
function savedLanguage(): string {
    try {
        const v = window.localStorage.getItem('language');
        return v && primeByLanguage[v] ? v : 'ca';
    } catch {
        return 'ca';
    }
}

export default {

    defaultLanguage: 'ca',

    locales: {
        ca: ca,
        es: es,
        en: en
    },

    moment: {
        // Inglés no hace falta, por defecto ya viene.
        ca: momentCA,
        es: momentES
    },

    prime: {
        // Textos de PrimeVue en l'idioma guardat https://primevue.org/configuration/#locale
        ...(primeByLanguage[savedLanguage()] ?? primeCA)
    }
}
