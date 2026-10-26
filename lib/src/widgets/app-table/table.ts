import Utils from "../../modules/utils";
import translate from "../../modules/translator";
import PaginatorStructure from "./paginator-structure";
import IButton from "../../interfaces/IButton";

export type TableColumn = {
    header: string|{component: any, props?: any},
    name: string,
    value?: (item: any, index: number) => string,
    component?: any,
    props?: (item: any, index: number) => any,
    width?: number,
    overflow?: 'none'|'hidden'|'dots'|'scroll',
    sortable?: boolean,
    class?: string,
    fixed?: boolean,
    edit?: (item: any) => undefined|((value: string) => void),
    search?: (value: string) => void,
    visible?: boolean,
    type?: string,
    filter?: {
        type: string,
        options?: any[],
        onSearch?: (q: string, setTotal: (total: any) => void) => Promise<any[]>,
        get?: (id: string) => Promise<any>,
        itemHTML?: (item: any, index?: number) => any,
        itemToQuery?: (item: any) => string|number,
        multiple?: boolean
    }
}

type TableItemOptionsMode = 'alwaysPopup'|
    'alwaysIcons'|
    'alwaysButtons'|
    'singleIconMultiplePopup'|
    'singleButtonMultiplePopup';

export default class Table {

    static create() {
        return new Table();
    }

    constructor() {
        this.useState('url');
        this.filters = Utils.queryParams();
    }

    _ref: any = null;
    setReference(ref: any) {
        this._ref = ref;
    }

    _striped: boolean = false;
    striped() : Table {
        this._striped = true;
        return this;
    }

    items: null|any[] = null;

    title: string = '';
    setTitle(title: string) : Table {
        this.title = title;
        return this;
    }

    _rowClass: (item: any) => any = () => {}
    setRowClass(rowClass: (item: any) => any) : Table {
        this._rowClass = rowClass;
        return this;
    }

    columns: TableColumn[] = [];
    setColumns(columns: TableColumn[]) : Table {
        this.columns = columns;
        return this;
    }

    itemOptions?: (item: any) => {label?: string, icon?: string, command?: () => void, link?: string}[];
    _itemOptionsMode: TableItemOptionsMode = 'singleButtonMultiplePopup';
    setItemOptions(options: (item: any) => {label?: string, icon?: string, command?: () => void, link?: string}[],
    mode: TableItemOptionsMode = 'singleButtonMultiplePopup') : Table {
        this.itemOptions = options;
        this._itemOptionsMode = mode;
        return this;
    }

    page: number = 1;
    get offset() : number {
        return (this.page - 1) * this.pageSize;
    }
    sort?: {
        by: string,
        order: 'ASC'|'DESC'
    };

    get pageSize() : number {
        if (!this._paginator) return 10;
        return this._paginator.pageSize;
    }
    set pageSize(value: number) {
        if (!this._paginator) return;
        this._paginator.pageSize = value;
    }

    _handleSort($e: any) {
        if (!$e.sortField) {
            if (this.sort && this.sort.by && this.sort.order == 'ASC') {
                this.sort.order = 'DESC';
            }
            else {
                this.sort = undefined;
            }
        }
        else {
            this.sort = {
                by: $e.sortField,
                order: $e.sortOrder > 0 ? 'ASC' : 'DESC'
            }
        }
        this.refresh();
    }
    sortedBy(field: string, dir: 'ASC'|'DESC' = 'ASC') : Table {
        this.sort = {
            by: field,
            order: dir
        }
        return this;
    }

    _fetch?: (table: Table) => Promise<any[]>;
    fetch(action: (resolve: (items: any[]) => void, reject?: (err?: any) => void) => void) : Table {
        this._fetch = () => new Promise((resolve, reject) => {

            const emptyMessage = this.emptyMessage;

            if (this._ref) {
                this._ref.loading = true;
                this.emptyMessage = '';
                if (!this.items || this.items.length > 0) {
                    this.items = [];
                }
                this._ref.lockTableHeight();
            }

            if (this.stateType == 'url') {
                if (!this._originalState) {
                    this.getOriginalState();
                }
                this.updateURLState();
            }    

            new Promise(action)
            .then((response : any) => {

                if (this._ref) {
                    this._ref.loading = false;
                    this.emptyMessage = emptyMessage;
                    this._ref.unlockTableHeight();
                }
                if (this.stateType == 'url') {
                    this.updateURLState();
                }    
                resolve(response);
            })
            .catch(reject)
        })
        return this;
    }

    _draggable?: ($e: {from: number, to: number}) => void
    draggable(onDrag: ($e: {from: number, to: number}) => void) : Table {
        this._draggable = onDrag;
        return this;
    }

    _gridlines: boolean = false;
    gridlines() : Table {
        this._gridlines = true;
        return this;
    }

    _resizeColumns?: 'fit'|'expand';
    resizeColumns(mode: 'fit'|'expand' = 'fit') : Table {
        this._resizeColumns = mode;
        return this;
    }

    _onClickRowListener?: (item: any, double: boolean, $event: any) => void;
    onClickRow(listener: ((item: any, double: boolean, $event: any) => void)) : Table {
        this._onClickRowListener = listener;
        return this;
    }

    emptyMessage: string = translate.get('table.empty');
    setEmptyMessage(message: string) : Table { 
        this.emptyMessage = message;
        return this;
    }

    selectedItems: any = [];

    isSelected(item: any) : boolean {
        return this.selectedItems.includes(item);
    }

    _selectable?: 'single'|'multiple'|'checkbox'|'radio';
    _selectedListener?: ( listener: (($e: any) => void)|undefined, selected: boolean ) => void

    selectableRows(type: 'single'|'multiple'|'checkbox'|'radio',
        listener: (selectedItem: any, selected: boolean) => void) : Table {

        this._selectedListener = ($e: any, selected: boolean) => {
            if ($e === undefined) {
                if (this.items) {
                    this.selectedItems = [];

                    for(const item of this.items) {
                        item['selected'] = selected;

                        if (selected)
                            this.selectedItems.push(item);
                    }
                }
            } else {
                $e['selected'] = selected;
            }
            listener($e, selected);
        };
        this._selectable = type;
        return this;
    }

    selectItem(item: any) {
        if (!this._selectedListener) return;
        const index = this.selectedItems.indexOf(item);
        if (index >= 0) {
            this.selectedItems.splice(index, 1);
        }
        else {
            this.selectedItems.push(item);
        }
        this._selectedListener(item, index < 0);
    }

    _bulkActions: any[] = [];
    setBulkActions(actions: IButton[]) : Table {
        this._bulkActions = actions;
        return this;
    }

    selectableAndBulkActions(actions: IButton[], listener?: (selectedItem: any, selected: boolean) => void) : Table {
        this.selectableRows('checkbox', listener ?? (() => {}) );
        this.setBulkActions(actions);
        return this;
    }

    _lockedItems : any = [];
    setLockedItems(items: any[]) : Table {
        this._lockedItems = items;
        return this;
    }

    _expandedRows: any[] = [];
    _expansion?: {html: boolean, component: any, props?: (item: any) => any}
    setExpansion(component: any, props?: (item: any) => any) : Table {
        this._expansion = {
            html: typeof(component) == 'function' ? true : false,
            component,
            props
        }
        return this;
    }
    expand(items: any) : Table {
        this._expandedRows = items;
        return this;
    }
    expandAll() : Table {
        const e : any[]= [];
        if (this.items) {
            for(const item of this.items) {
                e.push(item);
            }
        }
        this._expandedRows = e;
        return this;
    }
    collapseAll() : Table {
        this._expandedRows = [];
        return this;
    }

    _paginator : any = null;
    getPagination() : { pageSize: number, totalResults: number, structure: PaginatorStructure } {
        return this._paginator;
    }
    pagination(paginator: {
        pageSize?: number,
        totalResults?: number
    }) : Table {
        this._paginator = {
            pageSize: paginator.pageSize ? paginator.pageSize : (this._paginator ? this._paginator.pageSize : 10),
            totalResults: paginator.totalResults ? paginator.totalResults : (this._paginator ? this._paginator.totalResults : 10),
            structure: this._paginator ? this._paginator.structure : new PaginatorStructure()
        };
        return this;
    }

    paginator(structure: PaginatorStructure, itemsPerPage:number = 10) : Table {
        if (!this._paginator) {
            this._paginator = {
                structure: structure,
                pageSize: itemsPerPage,
                totalResults: 0
            }
        }

        this._paginator.structure = structure;
        return this;
    }

    stateType?: 'session'|'storage'|'url';
    stateKey?: string;
    useState(type: 'session'|'storage'|'url'|'none', key: string = 'table-session') : Table {
        if (type == 'none') {

            const params = Utils.queryParams();
            Object.keys(params)
            .forEach(key => {
                if (this.filters[key]) {
                    delete this.filters[key];
                }
            });

            this.stateType = undefined;
            this.stateKey = undefined;
            return this;
        }
        this.stateType = type;
        this.stateKey = key;
        return this;
    }

    filters: any = {};

    private _originalState: any = null;
    private _currentState: any = {};
    private _previousState: any = undefined;
    private getOriginalState() {

        // Save default values
        this._originalState = {
            page: this.page,
            sortBy: this.sort ? this.sort.by : undefined,
            sortOrder: this.sort ? this.sort.order : 1,
            pageSize: this.pageSize
        }

        // But now get values from URL
        const q = Utils.queryParams();
        
        if (q.sortBy) {
            const by = q.sortBy;
            const dir = q.sortOrder ? Number(q.sortOrder) : 1;
            this.sort = {
                by,
                order: dir > 0 ? 'ASC' : 'DESC'
            }
        }
        if (q.pageSize) this.pageSize = Number(q.pageSize);
        if (q.page) {
            this.page = Number(q.page);
            if (this._ref) {
                this._ref.paginatorFirst = (this.page - 1) * this.pageSize;
            }
        }

    }
    private updateURLState() {

        const o = this._originalState;
        const f = this.filters;
        const exc = ['page', 'sortBy', 'sortOrder', 'pageSize'];

        const q = Utils.queryParams();
        q['page'] = this.page;
        q['sortBy'] = this.sort ? this.sort.by : undefined;
        q['sortOrder'] = this.sort ? this.sort.order : 1;
        q['pageSize'] = this.pageSize;

        const filtersDoesNotContain = (key: string) => 
            f[key] === undefined
            || f[key] === ''
            || f[key] == null
            || f[key] == 'undefined';

        const addToQuery = (key: string) => q[key] = f[key];

        // If not the first load (already had loaded filters)
        // and now some filter disappeared from table.filters,
        // also remove it from the URL
        if (this._previousState) {
            Object.keys(q)
            .forEach((k: string) => {
                if (filtersDoesNotContain(k)) {
                    delete q[k];
                }
            });
        }

        // Original state is only used for pagination, not the rest of filters
        const paginationFilterIsDefault = (key: string) => q[key] == o[key];
        // If there is a default pagination value in the URL, like page=1, remove it
        Object.keys(q)
        .forEach((k: string) => {
            if (o[k] && 
                (filtersDoesNotContain(k) 
                || paginationFilterIsDefault(k))
            ) {
                delete q[k];
            }
        });

        // Add table.filters values to URL
        if (f) {
            Object.keys(f)
            .forEach((k: string) => {
                if (exc.includes(k)) return;
                addToQuery(k);
            });
        }

        this._currentState = q;

        // If had a previous state
        if (this._previousState) {

            // If filters changed, reset to page 1
            Object.keys(this._currentState)
            .forEach((k: string) => {
                if (
                    (!this._previousState[k] || this._currentState[k] != this._previousState[k])
                    &&
                    !exc.includes(k)
                ) {
                    this.page = 1;
                    this._currentState['page'] = 1;
                }
            });
        }

        this._previousState = this._currentState;
        Utils.setQueryParams(this._currentState);

    }

    setStateFilters(filters: any) : Table {

        const keep = ['page', 'sortBy', 'sortOrder', 'pageSize'];

        const filtersKeys = Object.keys(filters);

        filtersKeys.forEach((k: string) => {
            this._currentState[k] = filters[k];
        })

        // Now remove filters that were in _currentState but are not in "filters"
        Object.keys(this._currentState)
        .forEach((k: string) => {
            if (keep.includes(k)) return;

            if (!filtersKeys.includes(k)) {
                delete this._currentState[k];
            }
        });

        this.updateURLState();

        return this;
    }

    refresh() : Table {
        if (!this._fetch) return this;

        this._fetch(this)
        .then(items => {
            this.items = items;
            this.pagination({})

            //// Update selectedItems list
            const newSelected : any[] = [];
            for(const i of this.selectedItems) {
                let found = false;
                for(const i2 of this.items) {
                    if (i == i2) {
                        found = true;
                        newSelected.push(i2);
                        break;
                    }
                    const keys = ['id', 'key', 'name'];
                    let found2 = false;
                    for(const k of keys) {
                        if (
                            typeof i == 'object' &&
                            typeof i2 == 'object' &&
                            i[k] && i2[k] &&
                            i[k] == i2[k]
                        ) {
                            newSelected.push(i2);
                            found = true;
                            found2 = true;
                            break;
                        }
                    }
                    if (found2) {
                        break;
                    }
                }
                if (!found) {
                    newSelected.push(i);
                }
            }
            this.selectedItems = newSelected;
            /////

        })
        .catch(err => {
            console.log("ERROR fetching table items:", err);
        })

        return this;
    }

    exportCSV() {
        if (!this._ref) return;
        this._ref.exportCSV()
    }

    endEdit(save: boolean = false) {
        if (!this._ref) return;
        this._ref._endEdit(save);
    }

    _useVisibility: boolean = false;
    useVisibility() : Table {
        this._useVisibility = true;
        return this;
    }

    _exportable?: ((format: string) => void);
    setExportable(onExport: (format: string) => void) : Table {
        this._exportable = onExport;
        return this;
    }

}