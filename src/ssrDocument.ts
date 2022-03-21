import { DEFAULT_APP_ROOT } from './constants';

export const SSR_PREFIX = "__SSR_";
export const SSR_ROOT_HYDRATION_ID = "__SSR_ROOT"
export const SSR_TEXT_TYPE = "_text";
const HTML_ATTRIBUTE_NAME_CONVENSION = {
    "classname": "class"
}

type SSRInternalProperties = {
    hydrationId: string,
    type: string,
    parent?: SSRHtmlElement,
    children: SSRHtmlElement[],
    isRoot?: boolean,
}

// const domMethods = ['removeEventListener', 'addEventListener', 'appendChild', 'removeChild'];

export type SSRHtmlElement = {
    [key: Exclude<string, '__internal'>]: string | SSRInternalProperties | Function
    __internal: SSRInternalProperties,
    appendChild: (c: SSRHtmlElement) => void;
    removeChild: (c: SSRHtmlElement) => void;
    removeEventListener: () => void;
    addEventListener: () => void;
    nodeValue?: string; // For text node
}

// append to last child.
// https://developer.mozilla.org/en-US/docs/Web/API/Node/appendChild
// The appendChild() method of the Node interface adds a node to the end of the list of children of a specified parent node.
// If the given child is a reference to an existing node in the document, appendChild() moves it from its current position to the new position (there is no requirement to remove the node from its parent node before appending it to some other node).
// This means that a node can't be in two points of the document simultaneously. So if the node already has a parent, the node is first removed, then appended at the new position. 
const appendChild = function (this: SSRHtmlElement, child: SSRHtmlElement) {
    this.removeChild(child);
    child.__internal.parent = this;
    this.__internal.children = [...this.__internal.children, child];
    return this;
}

// remove child recursivly
const removeChildRecur = function (parent: SSRHtmlElement, targetId: string) {
    const parentDirectChilds = parent.__internal.children || [];
    const parentDirectChildsTryRemoveChildId = (parentDirectChilds.length > 0) ? (parentDirectChilds.filter(c => c.__internal.hydrationId !== targetId)) : ([]);
    parent.__internal.children = parentDirectChildsTryRemoveChildId;
    if ((parentDirectChilds.length > 0) && (parentDirectChildsTryRemoveChildId.length === parentDirectChilds.length)) {
        parentDirectChilds.forEach(c => {
            removeChildRecur(c, targetId)
        })
    }
}

// remove child recursivly
const removeChild = function (this: SSRHtmlElement, child: SSRHtmlElement) {
    removeChildRecur(this, child.__internal.hydrationId);
    return this;
}

// dummy methods
const removeEventListener = () => {
    console.log('removeEventListener is ignored in server-side rendering.')
}

const addEventListener = () => {
    console.log('addEventListener is ignored in server-side rendering.')
}

class SSRDocument {
    private domRoot: SSRHtmlElement;
    private domCounter: number;
    constructor(rootId?: string) {
        this.domRoot = {
            __internal: {
                hydrationId: SSR_ROOT_HYDRATION_ID,
                type: 'div',
                parent: undefined,
                children: [],
                isRoot: true,
            },
            appendChild,
            removeEventListener,
            addEventListener,
            removeChild,
            id: rootId || DEFAULT_APP_ROOT
        }
        this.domCounter = 0;
    }
    public getRoot = () => this.domRoot;
    public createTextNode = (text: string): SSRHtmlElement => {
        const dom = this.createElement(SSR_TEXT_TYPE);
        dom.nodeValue = text || '';
        return dom;
    }
    public createElement = (type: string): SSRHtmlElement => {
        this.domCounter = this.domCounter + 1;
        return {
            __internal: {
                hydrationId: SSR_PREFIX + this.domCounter,
                type,
                parent: undefined,
                children: []
            },
            appendChild,
            removeEventListener,
            addEventListener,
            removeChild
        }
    }

    private normalizeAtrributeName = (p: string): string => {
        return HTML_ATTRIBUTE_NAME_CONVENSION[p.toLowerCase()] || p;
    }

    private renderSSRDom = (ssrDom: SSRHtmlElement) => {
        const type = ssrDom.__internal.type;
        if (ssrDom.__internal.type === SSR_TEXT_TYPE) {
            // https://lihautan.com/hydrating-text-content/#is-this-a-bug
            return `<!-- ${ssrDom.__internal.hydrationId} -->${ssrDom.nodeValue}`;
        } else {
            const childString = ssrDom.__internal.children.map(c => this.renderSSRDom(c)).join('');
            if (ssrDom.__internal.isRoot) {
                return childString;
            } else {
                const attributesArray = Reflect.ownKeys(ssrDom).filter((p: string) => ((typeof ssrDom[p] === 'string') || (typeof ssrDom[p] === 'number'))).map((k: string) => `${this.normalizeAtrributeName(k)}="${ssrDom[k] || ''}"`);
                attributesArray.push(`data-hydration-id="${ssrDom.__internal.hydrationId}"`);
                const attributesString = attributesArray.join(' ');
                return `<${type}${attributesArray.length > 0 ? ` ${attributesString}` : ''}>${childString}</${type}>`
            }
        }
    }

    public exportString = (includeRoot?: boolean) => {
        if (includeRoot) {
            return `<div id="${this.getRoot()['id']}" data-hydration-id="${this.getRoot().__internal.hydrationId}">${this.renderSSRDom(this.getRoot())}</div>`
        } else {
            return this.renderSSRDom(this.getRoot());
        }
    }
}

export default SSRDocument;