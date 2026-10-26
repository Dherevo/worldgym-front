import es from "./es"

// Moment:
import momentES from "../../../lib/moment-locales/es";

// Prime:
import primeES from "primelocale/es.json";

export default {

    defaultLanguage: 'es',

    locales: {
        es: es
        // Agregar otros idiomas aquí
    },

    moment: {
        // Inglés no hace falta, por defecto ya viene.
        es: momentES
    },

    prime: {
        // Agrega aquí traducciones de PrimeVue https://primevue.org/configuration/#locale
        ...primeES
    }
}