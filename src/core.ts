import { SUSURU_TEXT_ELEMENT_TYPE } from './constants';
import { Fiber, SusuruElement, SusuruElementType } from './types';
import { scheduler } from './scheduler';

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

const createDom = (fiber: Fiber, _document?: Document) => {
    const __document = _document || document;
    const isText = fiber.node.type === SUSURU_TEXT_ELEMENT_TYPE;
    if (isText) {
        const dom = __document.createTextNode(fiber.node.props?.nodeValue || '');
        return dom;
    } else {
        const dom = __document.createElement(fiber.node.type);
        Object.keys(fiber.node.props).filter(p => p !== 'children').forEach((p) => dom.setAttribute(p, fiber.node.props[p]));
        return dom;
    }
}

const renderFiber = (fiber: Fiber): Function => {
    if (!fiber.dom) {
        fiber.dom = createDom(fiber)
    }
    if (fiber.parent) {
        fiber.parent.dom.appendChild(fiber.dom)
    }
    const elements = fiber.node.props.children;
    let prevSibling = null;
    elements.forEach((element, index) => {
        const newFiber = {
            node: element,
            parent: fiber,
            dom: null,
        }
        if (index === 0) {
            fiber.child = newFiber;
        } else {
            prevSibling.sibling = newFiber;
        }
        prevSibling = newFiber;
    })
    if (fiber.child) {
        return () => renderFiber(fiber.child);
    }
    let nextFiber = fiber
    while (nextFiber) {
        if (nextFiber.sibling) {
            return () => renderFiber(nextFiber.sibling);
        }
        nextFiber = nextFiber.parent
    }
    return () => { };
}

const render = (element: SusuruElement, container: HTMLElement, _document?: Document) => {
    scheduler.setNextUnitOfWork(() => renderFiber({
        dom: container,
        node: {
            props: {
                children: [element]
            }
        } as SusuruElement,
    }));
}

export { createElement, render };