
const HeadManager : {
    _firstPageStarted: boolean,
    addedElements: ChildNode[],
    modifiedElements: {element: Element, content: string}[],
    setTitle: (str: string) => void,
    removePreviousAddedElements: () => void,
    replaceElement: (tag: string, attr: {name: string, value?: string}, newElement: HTMLElement) => boolean,
    addHeadChild: (e: ChildNode) => void,
    addLines: (str: string) => void
} = {
    _firstPageStarted: false,
    addedElements: [],
    modifiedElements: [],

    setTitle(str: string) {
        const title = document.head.querySelector('title');
        if (title) {
            this.modifiedElements.push({
                element: title,
                content: title.outerText
            })
            title.innerText = str;
        } else {
            const e = document.createElement('title');
            e.innerHTML = str;
            document.head.appendChild(e);
        }
    },

    removePreviousAddedElements() {
        if (this._firstPageStarted) {
            for(const e of this.addedElements) {
                document.head.removeChild(e);
            }
            for(const e of this.modifiedElements) {
                e.element.outerHTML = e.content;
            }
        }
        this._firstPageStarted = true;
        this.addedElements = [];
        this.modifiedElements = [];
    },

    replaceElement(tag: string, attr: {name: string, value?: string}, newElement: HTMLElement) {

        const selector = tag + `[${attr.name}${(attr.value ? '="' + attr.value + '"' : '')}]`;
        const c = document.head.querySelector(selector);

        if (!c) {
            this.addHeadChild(newElement);
            return false;
        }

        this.modifiedElements.push({
            element: c,
            content: c.outerHTML
        });
        c.outerHTML = newElement.outerHTML;
        return true;

    },

    addHeadChild(e: any) {
        this.addedElements.push(e);
        document.head.appendChild(e);
    },

    addLines(str: string) {
        const container = document.createElement('div');
        container.innerHTML = str;

        const aux = document.createElement('div');

        const titleTag = e => {
            this.setTitle(e.innerHTML);
            aux.appendChild(container.firstChild!);
        }

        const metaTag = e => {
            if (e.hasAttribute('charset')) {
                if (this.replaceElement('meta', {name: 'charset'}, e)) {
                    aux.appendChild(e);
                }
            }
            else if (e.hasAttribute('name')) {
                if (this.replaceElement('meta', {
                    name: 'name',
                    value: e.getAttribute('name')!
                }, e)) {
                    aux.appendChild(e);
                }
            
            }
            else if (e.hasAttribute('property')) {
                if (this.replaceElement('meta', {
                    name: 'property',
                    value: e.getAttribute('property')!
                }, e)) {
                    aux.appendChild(e);
                }
            } else {
                document.head.appendChild(container.firstChild!);
            }
        }

        const linkTag = e => {
            if (e.hasAttribute('rel') && e.getAttribute('rel') == 'icon') {
                if (this.replaceElement('link', {
                    name: 'rel',
                    value: 'icon'
                }, e)) {
                    aux.appendChild(e);
                }
            } else {
                document.head.appendChild(container.firstChild!);
            }
        }

        while (container.firstChild) {

            if (container.firstElementChild) {
                const e : HTMLElement = container.firstElementChild as HTMLElement;
                const tag = e.tagName.toLowerCase();

                if (tag == 'title')
                    titleTag(e);

                else if (tag == 'meta') 
                    metaTag(e);

                else if (tag == 'link')
                    linkTag(e);

                else {
                    this.addHeadChild(container.firstChild);
                }
                
            } else {
                this.addHeadChild(container.firstChild);
            }

        }
    }
}
export default HeadManager;