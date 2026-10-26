
import { defineComponent, PropType } from 'vue';
import Loader from '../loader/loader.vue';
import Table, { TableColumn } from './table';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Paginator from 'primevue/paginator';
import Popup from '../popup/popup.vue';
import FormInput from '../form-input/form-input.vue';
import AnimatedNumber from '../animated-number/animated-number.vue';
import MirrorScroll from '../mirror-scroll/mirror-scroll.vue';
import Link from '../link/link.vue';
import translate from '../../modules/translator';
import Tooltip from '../tooltip/tooltip.vue';

export default defineComponent({

    components: { 
        Loader, 
        DataTable, 
        Column, 
        Paginator, 
        Popup, 
        FormInput, 
        AnimatedNumber,
        MirrorScroll,
        Link,
        Tooltip
    },

    props: {
        table: {
            type: Object as PropType<Table>
        }
    },

    data() {
        const data : {
            oldTable : null | Table,
            loading: boolean,
            paginatorFirst: number,
            lockedHeight: string,
            editItem: any,
            editCol?: TableColumn,
            editValue: string,
            visibilitySearch: string,
            visibilityOpen: boolean
        } = {
            oldTable: null,
            loading: false,
            paginatorFirst: 0,
            lockedHeight: '',
            editItem: undefined,
            editCol: undefined,
            editValue: '',
            visibilitySearch: '',
            visibilityOpen: false
        }
        return data;
    },

    mounted() {
        if (this.table) {
            this.updateReference();
        }
    },

    updated() {
        if (!this.table) return;
        if (this.table == this.oldTable) return;
        this.updateReference();
    },

    methods: {
        $t(key: string) {
            return translate.get(key);
        },
        hasSlot(name: string) {
            return !!this.$slots[name];
        },
        updateReference() {
            if (!this.table) return;
            this.table.setReference(this);
            this.oldTable = this.table;
            this.table.refresh();
        },
        exportCSV() {
            const t = this.ref('tableRef');
            if (!t) return;
            t.exportCSV();
        },
        onRowReorder($event: any) {
            if (!this.table) return;
            if (!this.table.items) return;

            const s = $event.dragIndex;
            const e = $event.dropIndex;

            if (s == e) return;

            const item = this.table.items.splice(s, 1)[0];

            this.table.items.splice(
                e,
                0,
                item
            )

            this.table!._draggable!({
                from: s, to: e
            });
        },

        rowStyle(data: any) {
            if (!this.table || !this.table.items) {
                return {}
            }
            return {
                position: 'relative',
                'z-index': this.table.items.length - this.table.items.indexOf(data)
            }
        },

        columnClass(col: TableColumn) {
            const obj : any = {}

            if (col.overflow == 'dots') {
                obj['text-ellipsis'] = true;
            }

            if (col.class) {
                obj[col.class] = true;
            }

            return obj;
        },

        columnStyle(col: TableColumn) {
            const obj : any = {}

            if (col.width) {
                obj['width'] = col.width + 'px';
                obj['min-width'] = col.width + 'px';
            }

            if (col.overflow && col.overflow != 'none') {
                if (col.overflow == 'hidden') {
                    obj['overflow'] = 'hidden';
                }
                else if (col.overflow == 'scroll') {
                    obj['overflow'] = 'auto';
                }
                if (col.width) obj['max-width'] = col.width + 'px';
            }

            return obj;
        },

        onPageChange($e: any) {
            this.table!._paginator.pageSize = $e.rows;
            this.table!.page = $e.page + 1;
            this.table!.refresh();
        },
        lockTableHeight() {
            const ref = this.ref('tableRef');
            if (!ref) return;

            const h = ref.$el.clientHeight;
            this.lockedHeight = (h * 1.12) + 'px';
        },
        unlockTableHeight() {
            this.lockedHeight = '';
        },

        _clickedRow($event: any, double: boolean = false) {
            if (!this.table) return;
            const items = this.table.items;
            if (!items) return;
            if ($event >= items.length) return;
            if (!this.table._onClickRowListener) return;
            this.table._onClickRowListener(items[$event], double, $event);

        },

        _isEditable(col: TableColumn, item: any) {
            if (!col.edit) return false;
            const r = col.edit(item);
            return r !== undefined;
        },

        _endEdit(save: boolean = true) {

            const col = this.editCol!;
            const object = this.editItem!;

            this.editItem = undefined;
            if (save) {
                object[col.name] = this.editValue;
            }
            this.editValue = '';
            this.editCol = undefined;

            if (save) {
                if (!col.edit) return;

                const r = col.edit(object);
                if (r) {
                    r(object[col.name]);
                }
            }
        },

        startEdit(item: any, col: any) {
            this.editItem = item;
            this.editCol = col;
            this.editValue = item[col.name];

            setTimeout(() => {
                let r = this.ref('editInput');
                if (!r || (Array.isArray(r) && r.length == 0)) return;
                if (Array.isArray(r)) r = r[0];
                r.focus();
            });
        },

        hasAtLeastOneSearch() {
            if (!this.table) return false;
            return this.table.columns.some(c => c.search);
        },

        getItemOptions(slotProps: any) {
            if (!this.table) return [];
            if (!this.table.itemOptions) return [];
            if (!slotProps.column) return [];

            if (!slotProps.column._itemActions) 
                slotProps.column['_itemActions'] = {};

            if (slotProps.column._itemActions[slotProps.index])
                return slotProps.column._itemActions[slotProps.index];

            slotProps.column._itemActions[slotProps.index] = this.table.itemOptions(slotProps.data);
            return slotProps.column._itemActions[slotProps.index] ?? [];
        },

        forceItemActionsColumnWidth() {

            setTimeout(() => {

                const ref : any = this.$refs.itemActionButtonsCol;
                const elements : HTMLElement[] = Array.isArray(ref) ? ref : [ref];

                for(const e of elements) {
                    const td = e.parentElement;

                    if (!td) continue;
                    if (td.style.width) continue;
                    td.style.width = e.clientWidth + 'px';
                }

            });

            return {};
        }
    }

})