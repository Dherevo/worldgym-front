import { Table, AppTable, translate, Avatar, $t, FormInput } from "lib";
import { Component, Vue, toNative } from "vue-facing-decorator";
import User from "@/models/user";
import Tag from 'primevue/tag';

@Component({
    components: { AppTable, Tag, Avatar, FormInput }
})
class UsersPage extends Vue {

    table: Table = Table.create();

    created() {
        this.addDEMOTranslations();
        this.configureTable();
    }

    addDEMOTranslations() {
        ////////////// DEBUG
        // Esto se pondría en el archivo de traducciones,
        // lo pongo aquí sólo para DEMO
        translate.merge({
            department: {
                sales: "Ventas",
                humanresources: "RRHH",
                marketing: "Marketing",
                management: "Administración",
                it: "IT",
                finance: "Finanzas"
            },

            status: {
                active: "Activo",
                waiting: "Pendiente",
                disabled: "Desactivado"
            }
        })
        //////////////
    }

    configureTable() {
        this.table

        .setTitle(this.$t('users.plural'))

        // Get data from API
        .fetch(resolve => {

            const filters = {
                page: this.table!.page,
                department: this.table!.filters.department == 'all' ? '' : this.table!.filters.department,
                search: this.table!.filters.name
            }

            // API GET /users
            User.list(filters)
            .then(response => {

                this.table!.pagination({
                    pageSize: response.perPage,
                    totalResults: response.totalItems
                });

                resolve(response.items);
            })

        })

        // Que las filas se puedan seleccionar
        .selectableRows('checkbox', (_selectedItem, _active) => {
            // Item was selected
            // this.table!.selectedItems
            
            if (this.table!.selectedItems.length > 0) {
                this.table!.setBulkActions([
                    {
                        content: 'Edit',
                        icon: 'heroicons-solid/pencil',
                        onClick: () => {
                            alert('Edit');
                        }
                    },
                    {
                        content: 'Delete',
                        icon: 'heroicons-solid/trash',
                        onClick: () => {
                            alert('Delete');
                        }
                    }
                ]);
            } else {
                this.table!.setBulkActions([]);
            }
        })

        /**  O se puede simplificar lo anterior con esto:
        .selectableAndBulkActions([
            {
                content: 'Delete',
                icon: 'heroicons-solid/trash',
                onClick: () => {
                    alert('Delete');
                }
            }
        ])*/

        .setItemOptions(_item => [
            {
                label: 'Edit',
                icon: 'heroicons-solid/pencil',
                command: () => {
                    alert('Edit');
                }
            },
            {
                label: 'Delete',
                icon: 'heroicons-solid/trash',
                command: () => {
                    alert('Delete');
                }
            }
        ])

        // Set table columns
        .setColumns([
            {
                header: 'Name',
                name: 'name',
                sortable: true,

                search: (_search: string) => {
                    this.table!.refresh();
                }
            },
            {
                header: 'Departamento',
                name: 'department',
                value: (item: User) => $t("department." + item.department),
                edit: (_value: string, _item: any) => {
                    // Para salir del modo edición tan pronto seleccionamos una opción
                    this.table!.endEdit();
                },
                search: (_search: string) => {
                    this.table!.refresh();
                },
                sortable: true
            },
            {
                header: 'Estado',
                name: 'status',
                edit: (_value: string, _item: any) => {
                    // Para salir del modo edición tan pronto seleccionamos una opción
                    this.table!.endEdit();
                },
            },
            {
                header: 'Registered at',
                name: 'date',
                value: (item: User) => item.date ? item.date.format('DD MMMM YYYY') : ''
            }
        ]);
    }

}
export default toNative(UsersPage);