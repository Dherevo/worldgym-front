<template>
    <div class="app-table" :class="{
        clickable: table && table._onClickRowListener
    }">

        <slot name="header" v-if="hasSlot('header')"/>
        <div v-else-if="table && table.title" class="app-table-header">

            <h1>{{table.title}}</h1>

            <div class="results" v-if="table._paginator && table._paginator.totalResults">
              <AnimatedNumber v-model="table._paginator.totalResults"/> {{ $t('generic.results') }}
            </div>

            <div class="flex-grow"/>

            <Paginator v-if="table._paginator && 
                (table.items && table.items.length 
                && table._paginator.totalResults > table._paginator.pageSize)
                || (table._paginator && table._paginator.structure.has('RowsPerPageDropdown'))" 
            v-model:first="paginatorFirst"
            :rows="table._paginator.pageSize" :totalRecords="table._paginator.totalResults"
            :template="table._paginator ? table._paginator.structure.toString() : undefined"
            :rowsPerPageOptions="table._paginator ? table._paginator.structure.perPageOptions : undefined"
            @page="onPageChange($event)" 
            :currentPageReportTemplate="table._paginator ? table._paginator.structure.textTemplate : undefined"/>

        </div>

        <div class="bulk-actions" v-if="table && table._bulkActions && table._bulkActions.length > 0 && table.selectedItems.length > 0">
            
            <div class="count">{{ $t('table.count_selected', {count: table?.selectedItems.length}) }}</div>

            <btn v-for="(action, index) in table._bulkActions" :key="index" @click="action.onClick()">
                <svg-icon :name="action.icon" v-if="action.icon && action.iconPosition != 'right'"/>
                {{ action.content }}
                <svg-icon :name="action.icon" v-if="action.icon && action.iconPosition == 'right'"/>
            </btn>

        </div>

        <MirrorScroll
            :scroller="$refs.tableRef"
            ref="mirrorScroll"/>

        <loader v-if="!table"/>
        <loader v-else-if="!table.items"/>

        <template v-else>

            <DataTable :value="table.items" 
            tableStyle="min-width: 50rem" 
            ref="tableRef" 
            scrollable
            :stripedRows="table._striped" 
            :onRowReorder="onRowReorder" 
            :showGridlines="table._gridlines"
            @sort="table._handleSort($event)" 
            removableSort 
            :sortField="table.sort ? table.sort.by : undefined" 
            :sortOrder="table.sort ? (table.sort.order == 'ASC' ? 1 : -1) : 0" 
            :loading="loading"
            v-model:selection="table.selectedItems" 
            :style="{height: lockedHeight}"
            :stateStorage="table.stateType && table.stateType != 'url' ? (table.stateType == 'session' ? 'session' : 'custom'): undefined"
            :stateKey="(table.stateKey && table.stateType != 'url') ? table.stateKey : undefined"
            :resizableColumns="table._resizeColumns ? true : false" :columnResizeMode="table._resizeColumns"
            :frozenValue="table._lockedItems.length > 0 ? table._lockedItems : undefined"
            v-model:expandedRows="table._expandedRows" 
            :selectionMode="table._selectable && ['single', 'multiple'].includes(table._selectable) ? (table._selectable == 'radio' ? 'radiobutton' : table._selectable) : null" 
            :metaKeySelection="false"
            @rowSelect="table && table._selectedListener ? table._selectedListener($event, true) : undefined" 
            @rowUnselect="table && table._selectedListener ? table._selectedListener($event, false) : undefined"
            @rowSelectAll="table && table._selectedListener ? table._selectedListener(undefined, true) : undefined"
            @rowUnselectAll="table && table._selectedListener ? table._selectedListener(undefined, false) : undefined"
            @rowClick="_clickedRow($event.index)"
            @rowDblclick="_clickedRow($event.index, true)"
            :rowStyle="rowStyle"
            :rowClass="data => [{
                'p-datatable-row-selected': table && table.selectedItems.includes(data)
            }, (table ? table._rowClass(data) : {})]"
            :class="table._ref && table._ref.loading ? 'loading' : ''">

                <template #empty v-if="table.emptyMessage">{{table.emptyMessage}}</template>

                <template #loading><loader/></template>

                <Column :selectionMode="table._selectable == 'radio' ? 'single' : 'multiple'" 
                headerStyle="width: 3rem" v-if="['checkbox', 'radio'].includes(table._selectable)"></Column>

                <Column :rowReorder="true" :class="'dragIconColumn'"  
                :frozen="true" :exportable="false" header="" v-if="table._draggable"></Column>

                <Column expander style="width: 3rem" v-if="table._expansion" />

                <Column v-for="(col, index) in table.columns" 
                :key="col.name"
                v-show="col.visible !== false"
                :field="col.name"
                :class="columnClass(col)"
                :style="columnStyle(col)"
                :sortable="col.sortable"
                :frozen="col.fixed"
                :alignFrozen="index >= table.columns.length - 1 ? 'right' : 'left'">

                    <template #header>
                        <div>
                            <component v-if="col.header && col.header.component" :is="col.header.component" 
                            v-bind="col.header.props ? col.header.props : {}"/>
                            <slot v-else-if="hasSlot('header-' + col.name)" :col="col"/>
                            <div v-else v-safe-html="col.header"/>

                            <div class="header-search" @click.stop>
                                <slot v-if="col.search && hasSlot('search-' + col.name)" :name="'search-' + col.name" 
                                :col="col"
                                :search="{
                                    complete: (value: any) => col.search(value)
                                }"
                                />
                                <form-input type="search" v-else-if="col.search" 
                                v-model="table.filters[col.name]" 
                                @stop="col.search(table.filters[col.name])"
                                :placeholder="$t('generic.search') + '...'"/>
                                <div v-else-if="hasAtLeastOneSearch()" class="header-search-placeholder"></div>
                            </div>
                        </div>
                    </template>

                    <template #body="slotProps">

                        <!-- When is not editable, just display the content -->
                        <template v-if="!_isEditable(col, slotProps.data)">
                            <template v-if="!hasSlot('col-' + col.name)">
                                <div v-if="col.value" v-html="col.value(slotProps.data, slotProps.index)"/>
                                <component v-else-if="col.component" :is="col.component" v-bind="col.props ? col.props(slotProps.data, slotProps.index) : {}"/>
                                <div v-else v-html="slotProps.data[col.name]"/>
                            </template>
                            <slot v-else :name="'col-' + col.name" :item="slotProps.data"/>
                        </template>

                        <!-- When it is editable, show the edit component -->
                        <template v-else>
                            <div v-if="editItem == slotProps.data && editCol == col" class="flex-row table-inline-edit editable">
                                <slot v-if="hasSlot('edit-' + col.name)" 
                                :name="'edit-' + col.name" 
                                :item="slotProps.data"
                                :value="editValue"
                                :setValue="(v: any) => { editValue = v }"/>

                                <input v-else ref="editInput" v-model="editValue" 
                                @keyup.enter="_endEdit(true)" 
                                @keyup.esc="_endEdit(false)">
                                
                                <svg-icon name="heroicons-solid/x-circle" @click.stop="_endEdit(false)"/>
                                <svg-icon name="heroicons-solid/check-circle" @click.stop="_endEdit(true)"/>
                            </div>

                            <div v-else class="flex-row gap5 table-inline-edit no-editable" @click.stop="startEdit(slotProps.data, col)">
                                <template v-if="!hasSlot('col-' + col.name)">
                                    <div v-if="col.value" v-html="col.value(slotProps.data, slotProps.index)"/>
                                    <component v-else-if="col.component" :is="col.component" v-bind="col.props ? col.props(slotProps.data, slotProps.index) : {}"/>
                                    <div v-else v-html="slotProps.data[col.name]"/>
                                </template>
                                <slot v-else :name="'col-' + col.name" :item="slotProps.data"/>
                                <svg-icon name="heroicons-solid/pencil" class="edit-icon"/>
                            </div>
                        </template>

                    </template>
                </Column>

                <Column v-if="table.itemOptions"
                :frozen="true"
                alignFrozen="right"
                :headerStyle="{
                    'max-width': '60px',
                    width: '60px'
                }"
                :style="{
                    width: table._itemOptionsMode == 'alwaysPopup' || 
                     (
                        table.itemOptions({
                            column: {},
                            data: table.items[0]
                        }).length > 1 &&
                        (table._itemOptionsMode == 'singleIconMultiplePopup' || table._itemOptionsMode == 'singleButtonMultiplePopup')
                    ) ? '60px' : ''
                }">
                    <template #header v-if="table._useVisibility">

                        <Popup class="visibility-button" 
                            icon="prime/eye"
                            :startOpen="visibilityOpen"
                            :onOpen="() => visibilityOpen = true">

                            <div class="visibility-popup">

                                <FormInput type="search" 
                                :placeholder="$t('generic.search')"
                                v-model="visibilitySearch"/>

                                <template v-for="(col, index) in table.columns"
                                :key="index">

                                    <FormInput type="checkbox"
                                        v-if="
                                            (col.name.toLowerCase().includes(visibilitySearch.toLowerCase()))
                                            ||
                                            (typeof col.header == 'string' 
                                            && col.header.toLowerCase().includes(visibilitySearch.toLowerCase()))
                                        "
                                        :label="col.header"
                                        v-model="col.visible" />

                                </template>

                            </div>
                        </Popup>

                    </template>

                    <template #body="slotProps">

                        <template v-if="table._itemOptionsMode == 'alwaysPopup'
                        || (table._itemOptionsMode == 'singleIconMultiplePopup' && getItemOptions(slotProps).length > 1)
                        || (table._itemOptionsMode == 'singleButtonMultiplePopup' && getItemOptions(slotProps).length > 1)">

                            <Popup 
                            :style="{
                                'max-width': '50px'
                            }" 
                            :autoClose="true"
                            class="p-datatable-itemoptions-popup" 
                            :expand="slotProps.index >= table.items.length / 2 ? 'top' : 'bottom'">
                                <template #content>
                                    <ul class="p-datatable-itemoptions-menu">

                                        <template v-for="(item, index) in getItemOptions(slotProps)"
                                            :key="index">

                                            <li class="flex-row gap5 p-datatable-itemoptions-menu-item"
                                            v-if="item.command"
                                            @click="item.command()">
                                                <svg-icon v-if="item.icon" :name="item.icon"/>
                                                <div>{{item.label}}</div>
                                            </li>

                                            <li class="flex-row gap5 p-datatable-itemoptions-menu-item"
                                            v-else>
                                                <Link :href="item.link">
                                                    <svg-icon v-if="item.icon" :name="item.icon"/>
                                                    <div>{{item.label}}</div>
                                                </Link>
                                            </li>

                                        </template>

                                    </ul>
                                </template>
                            </popup>

                        </template>

                        <div v-else-if="table._itemOptionsMode == 'alwaysIcons' || 
                        (table._itemOptionsMode == 'singleIconMultiplePopup' && getItemOptions(slotProps).length == 1)"
                        class="flex-row gap5 p-datatable-itemoptions-icons"
                        ref="itemActionButtonsCol"
                        :style="forceItemActionsColumnWidth()">

                            <template v-for="(item, index) in getItemOptions(slotProps)" :key="index">

                                <svg-icon v-if="!item.label" class="itemoption-icon" :name="item.icon" @click="item.command($event)"/>
                                <Tooltip v-else :text="item.label">
                                    <svg-icon class="itemoption-icon" :name="item.icon" @click="item.command($event)"/>
                                </Tooltip>

                            </template>

                        </div>

                        <div v-else-if="table._itemOptionsMode == 'alwaysButtons' || 
                        (table._itemOptionsMode == 'singleButtonMultiplePopup' && getItemOptions(slotProps).length == 1)"
                        class="flex-row gap5 p-datatable-itemoptions-buttons" 
                        ref="itemActionButtonsCol"
                        :style="forceItemActionsColumnWidth()">

                            <template v-for="(item, index) in getItemOptions(slotProps)" :key="index">

                                <btn v-if="!item.label" @click="item.command($event)" class="itemoption-btn">
                                    <svg-icon v-if="item.icon" :name="item.icon"/>
                                    <div v-if="item.label">{{item.label}}</div>
                                </btn>
                                <Tooltip v-else :text="item.label">
                                    <btn v-for="(item, index) in getItemOptions(slotProps)" :key="index" 
                                    @click="item.command($event)" class="itemoption-btn">
                                        <svg-icon v-if="item.icon" :name="item.icon"/>
                                        <div v-if="item.label">{{item.label}}</div>
                                    </btn>
                                </Tooltip>

                            </template>

                        </div>

                    </template>
                </Column>

                <template #expansion="slotProps" v-if="table._expansion">
                    <div v-if="table._expansion.html" v-safe-html="table._expansion.component(slotProps.data)" />
                    <component v-else :is="table._expansion.component" 
                    v-bind="table._expansion.props ? table._expansion.props(slotProps.data) : {}" />
                </template>

            </DataTable>

            <div class="app-table-footer flex-row">

                <div className="flex-grow">
                    <Paginator v-if="table._paginator && 
                            (table.items && table.items.length 
                            && table._paginator.totalResults > table._paginator.pageSize)
                            || (table._paginator && table._paginator.structure.has('RowsPerPageDropdown'))" 
                        v-model:first="paginatorFirst"
                        :rows="table._paginator.pageSize" :totalRecords="table._paginator.totalResults"
                        :template="table._paginator ? table._paginator.structure.toString() : undefined"
                        :rowsPerPageOptions="table._paginator ? table._paginator.structure.perPageOptions : undefined"
                        @page="onPageChange($event)" 
                        :currentPageReportTemplate="table._paginator ? table._paginator.structure.textTemplate : undefined"/>
                </div>

                <Popup v-if="table && table._exportable"
                    :autoClose="true"
                    expand="top"
                    class="export-popup">

                    <template #button>
                        <Btn class="export-btn">
                            <span>{{ $t('generic.export') }}</span>
                            <SvgIcon name="prime/chevron-up"
                            style="width: 30px;height: 30px"/>
                        </Btn>
                    </template>

                    <div className="export-options">
                        <ul>
                            <li @click="() => table && table._exportable && table._exportable('csv')">CSV</li>
                            <li @click="() => table && table._exportable && table._exportable('excel')">Excel</li>
                            <li @click="() => table && table._exportable && table._exportable('pdf')">PDF</li>
                            <li @click="() => table && table._exportable && table._exportable('print')">{{ $t('generic.print') }}</li>
                        </ul>
                    </div>

                </Popup>

            </div>

        </template>

    </div>
</template>

<script lang="ts" src="./app-table.ts"></script>
<style lang="scss" src="./app-table.scss"></style>