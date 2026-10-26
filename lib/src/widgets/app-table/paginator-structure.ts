
export default class PaginatorStructure {

    private str : string = '';

    static create() : PaginatorStructure {
        return new PaginatorStructure();
    }

    private __add(str: string) {
        if (this.str != '') {
            this.str += ' ';
        }
        this.str += str;
    }

    has(module:string) {
        return this.str.includes(module);
    }

    FirstPage() : PaginatorStructure {
        this.__add('FirstPageLink');
        return this;
    }

    PrevPage() : PaginatorStructure {
        this.__add('PrevPageLink');
        return this;
    }

    Numbers() : PaginatorStructure {
        this.__add('PageLinks');
        return this;
    }

    NextPage() : PaginatorStructure {
        this.__add('NextPageLink');
        return this;
    }

    LastPage() : PaginatorStructure {
        this.__add('LastPageLink');
        return this;
    }

    perPageOptions: number[] = [5, 10, 25, 50, 100];
    PerPageSelector(options: number[] = [5, 10, 25, 50, 100]) : PaginatorStructure {
        this.perPageOptions = options;
        this.__add('RowsPerPageDropdown');
        return this;
    }

    PageSelector() : PaginatorStructure {
        this.__add('JumpToPageDropdown');
        return this;
    }

    PageInput() : PaginatorStructure {
        this.__add('JumpToPageInput');
        return this;
    }

    textTemplate: string = '';
    Text(template: string = '({currentPage} of {totalPages})') : PaginatorStructure {
        this.textTemplate = template;
        this.__add('CurrentPageReport');
        return this;
    }

    toString() : string {
        if (!this.str) {
            return 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink';
        }
        return this.str;
    }

}