import { SUSURU_TEXT_ELEMENT_TYPE } from './constants';
import { SusuruElement, SusuruElementType } from './types';

const createElement = (type: SusuruElementType, props: any, ...children: SusuruElement[]): SusuruElement => {
    return {
        type,
        props: {
            ...props,
            children: (children || []).map(child => {
                if (typeof child === 'object') {
                    return child;
                } else {
                    return createTextElement(child);
                }
            }),
        },
    }
}

const createTextElement = (text?: string | number | undefined | null | boolean): SusuruElement => {
    if (typeof text !== 'string' && typeof text !== 'number') {
        text = '';
    }
    return {
        type: SUSURU_TEXT_ELEMENT_TYPE,
        props: {
            nodeValue: text,
            children: []
        },
    }
}

const render = (element: SusuruElement, container: HTMLElement, _document?: Document) => {
    const __document = _document || document;
    const isText = element.type === SUSURU_TEXT_ELEMENT_TYPE;
    if (isText) {
        const dom = __document.createTextNode(element.props?.nodeValue || '');
        container.appendChild(dom);
    } else {
        const dom = __document.createElement(element.type);
        Object.keys(element.props).filter(p => p !== 'children').forEach((p) => dom.setAttribute(p, element.props[p]));
        (element.props.children || []).forEach(child => {
            render(child, dom);
        })
        container.appendChild(dom);
    }
}

export { createElement, render };