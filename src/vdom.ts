import { SUSURU_TEXT_ELEMENT_TYPE } from "./constants";
import { Fiber, SusuruElement, SusuruElementType } from "./types";
import Scheduler from './scheduler';
import HookController from "./hook";
import { flatArray } from "./utils";

class VdomController {

    private currentRoot: Fiber = null;
    private deletions: Fiber[] = null;
    private scheduler: Scheduler = null;
    public hookController: HookController = null;

    constructor() {
        this.scheduler = new Scheduler();
        this.hookController = new HookController();
    }

    // Create a new vdom node
    public createElement = (type: SusuruElementType, props: any, ...children: SusuruElement[]): SusuruElement => {
        return {
            type,
            props: {
                ...props,
                children: (children || []).map(child => {
                    if (typeof child === 'object') {
                        return child;
                    } else {
                        return this.createTextElement(child);
                    }
                }),
            },
        }
    }

    // Create a new vdom text node
    private createTextElement = (text?: string | number | undefined | null | boolean): SusuruElement => {
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

    // Create dom element for non-functional fiber
    private createDomForSimpleFiber = (fiber: Fiber, _document?: Document) => {
        const __document = _document || document;
        const isText = fiber.node.type === SUSURU_TEXT_ELEMENT_TYPE;
        if (isText) {
            const dom = __document.createTextNode(fiber.node.props?.nodeValue || '');
            return dom;
        } else {
            const dom = __document.createElement(fiber.node.type as Exclude<SusuruElementType, Function>);
            this.updateDom(dom, null, fiber.node);
            return dom;
        }
    }

    private updateFunctionComponent = (fiber: Fiber) => {
        this.hookController.setFunctionComponentFiber(fiber, this.reRender);

        // Note: Function components do not have dom set here. Therefore in commit stage, need to find parent's dom
        this.reconcileChildren(fiber, [(fiber.node.type as Function)(fiber.node.props)])
    }

    private updateHostComponent = (fiber: Fiber) => {
        if (!fiber.dom) {
            fiber.dom = this.createDomForSimpleFiber(fiber)
        }
        this.reconcileChildren(fiber, fiber.node.props.children)
    }

    // This function returns callback function that ready to execute next fiber weaving
    private weaveFiber = (fiber: Fiber): Function => {
        const isFunctionComponent =
            fiber.node.type instanceof Function;
        if (isFunctionComponent) {
            this.updateFunctionComponent(fiber);
        } else {
            this.updateHostComponent(fiber);
        }

        if (fiber.child) {
            return () => this.weaveFiber(fiber.child);
        }
        let nextFiber = fiber
        while (nextFiber) {
            if (nextFiber.sibling) {
                return () => this.weaveFiber(nextFiber.sibling);
            }
            nextFiber = nextFiber.parent
        }

        // Nothing left to do, 
        return () => { };
    }

    private reconcileChildren = (wipFiber: Fiber, elements: (SusuruElement | SusuruElement[])[]) => {
        let prevSibling = null;
        let oldFiber = wipFiber.previousState?.child;
        let index = 0;
        // flat array of elements
        const flatElements = flatArray(elements);
        while ((index < flatElements.length) || !!oldFiber) {
            const element = flatElements[index];
            let newFiber: Fiber = null;
            const sameType = oldFiber && element && (element.type === oldFiber.node.type);
            if (sameType) {
                newFiber = {
                    node: element,
                    dom: oldFiber.dom,
                    parent: wipFiber,
                    previousState: oldFiber,
                    effectTag: "UPDATE",
                }
            }
            if (element && !sameType) {
                newFiber = {
                    node: element,
                    dom: null,
                    parent: wipFiber,
                    previousState: null,
                    effectTag: "PLACEMENT",
                }
            }
            if (oldFiber && !sameType) {
                oldFiber.effectTag = "DELETION";
                this.deletions.push(oldFiber);
            }
            if (oldFiber) {
                oldFiber = oldFiber.sibling
            }
            if (index === 0) {
                wipFiber.child = newFiber;
            } else {
                prevSibling.sibling = newFiber;
            }
            prevSibling = newFiber;
            index++;
        }
    }

    // Inject props into real dom
    private updateDom = (dom: HTMLElement | Text, oldNode: SusuruElement | null, newNode: SusuruElement) => {

        const isNew = (prev, next) => key =>
            prev[key] !== next[key]
        const isGone = (prev, next) => key => !(key in next)
        const isEvent = key => key.startsWith("on") // TODO: give a better way to detect
        const isProperty = key =>
            key !== "children" && !isEvent(key)

        //Remove old or changed event listeners
        oldNode && Object.keys(oldNode.props)
            .filter(isEvent)
            .filter(
                key =>
                    !(key in newNode.props) ||
                    isNew(oldNode.props, newNode.props)(key)
            )
            .forEach(name => {
                const eventType = name
                    .toLowerCase()
                    .substring(2)
                dom.removeEventListener(
                    eventType,
                    oldNode.props[name]
                )
            })

        // Remove old properties
        oldNode && Object.keys(oldNode.props)
            .filter(isProperty)
            .filter(isGone(oldNode.props, newNode.props))
            .forEach(name => {
                dom[name] = ""
            })

        // Set new or changed properties
        Object.keys(newNode.props)
            .filter(isProperty)
            .filter(isNew(oldNode?.props || {}, newNode.props))
            .forEach(name => {
                dom[name] = newNode.props[name]
            })

        // Add event listeners
        Object.keys(newNode.props)
            .filter(isEvent)
            .filter(isNew(oldNode?.props || {}, newNode.props))
            .forEach(name => {
                const eventType = name
                    .toLowerCase()
                    .substring(2)
                dom.addEventListener(
                    eventType,
                    newNode.props[name]
                )
            })
    }

    private commitWork = (fiber?: Fiber) => {
        if (!fiber) {
            return;
        }
        let parent = fiber.parent;
        while (!parent.dom) {
            parent = parent.parent;
        }
        const domParent = parent.dom;
        if (
            fiber.effectTag === "PLACEMENT" &&
            fiber.dom != null
        ) {
            domParent.appendChild(fiber.dom)
        } else if (
            fiber.effectTag === "UPDATE" &&
            fiber.dom != null
        ) {
            this.updateDom(
                fiber.dom,
                fiber.previousState.node,
                fiber.node
            )
        } else if (fiber.effectTag === "DELETION") {
            domParent.removeChild(fiber.dom)
        }
        this.commitWork(fiber.child);
        this.commitWork(fiber.sibling);
    }

    private commitDeletion = (fiber: Fiber, domParent: HTMLElement | Text) => {
        if (fiber.dom) {
            domParent.removeChild(fiber.dom)
        } else {
            this.commitDeletion(fiber.child, domParent)
        }
    }

    // render element and mount to container
    public render = (element?: SusuruElement, container?: HTMLElement, wipRootProvided?: Fiber) => {
        const _wipRoot = wipRootProvided || {
            dom: container,
            node: {
                props: {
                    children: [element]
                }
            } as SusuruElement,
            isRoot: true,
            previousState: this.currentRoot
        } as Fiber;
        this.deletions = [];
        this.scheduler.setNextUnitOfWork(() => {
            return this.weaveFiber(_wipRoot)
        });
        this.scheduler.setOnTasksFinished((hasFinishedAllTasks) => {
            // child of wipRoot will be filled in after first weaveFiber
            if (hasFinishedAllTasks) {
                this.deletions.forEach(this.commitWork);
                this.commitWork(_wipRoot.child);
                this.currentRoot = _wipRoot;
            }
        })
    }

    public reRender = () => {
        const wipRoot = {
            dom: this.currentRoot.dom,
            node: this.currentRoot.node,
            isRoot: true,
            previousState: this.currentRoot
        } as Fiber;
        this.render(undefined, undefined, wipRoot);
    }
}

export default VdomController;