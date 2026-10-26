import { ComponentOptions } from "vue";

/**
 * Lo que pongas aquí, todos los componentes del proyecto lo heredarán.
 * 
 * por lo tanto, si quieres que todos los componentes tengan una propiedad o un método
 * compartido, ponlo aquí. Y descomenta la línea comentada en /src/main.ts
 */

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        // Agrega aqui las propiedades que crees abajo, para que el IDE
        // te las reconozca en todos los componentes.
    }
}
export default (app: any) => {

    // Base component
    const base : ComponentOptions = {

        data() {
            return {
            }
        },

        created() {},

        methods: {}

    }
    app.mixin(base);

}