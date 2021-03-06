import { DEFAULT_APP_ROOT, SUSURU_TEXT_ELEMENT_TYPE, SUSURU_EMPTY_ELEMENT_TYPE } from "./constants";
import { Fiber, SusuruElement, SusuruElementType } from "./types";
import Scheduler from './scheduler';
import HookController from "./hook";
import { flatArray } from "./utils";
import SSRDocument, { SSRHtmlElement, SSR_PREFIX, SSR_ROOT_HYDRATION_ID } from "./ssrDocument";

class VdomController {

    private currentRoot: Fiber = null;
    private deletions: Fiber[] = null;
    private scheduler: Scheduler = null;
    private _document: Document | SSRDocument = document;
    public hookController: HookController = null;
    // private vnodes: Map<number, SusuruElement> = undefined;
    private domCounter: number = undefined;
    private hydration: boolean = undefined;

    constructor(s: Scheduler, h: HookController) {
        this.scheduler = s;
        this.hookController = h;
        this.reset();
    }

    public reset = () => {
        this.scheduler.reset();
        this.currentRoot = null;
        this.deletions = null;
        this.hydration = undefined;
        this.domCounter = 0;
    }

    // Create a new vdom node
    public createElement = (type: SusuruElementType, props: any, ...children: SusuruElement[]): SusuruElement => {

        const result = {
            type,
            props: {
                ...props,
                children: (children || []).map(child => {
                    if (typeof child === 'object') {
                        return child;
                    } else {
                        return this.createNakedElement(child);
                    }
                }),
            }
        }
        return result;
    }

    // Create a new vdom text node
    private createNakedElement = (text?: string | number | undefined | null | boolean): SusuruElement => {
        let result: SusuruElement;
        if ((typeof text !== 'string') && (typeof text !== 'number')) {
            result = {
                type: SUSURU_EMPTY_ELEMENT_TYPE,
                props: {
                    children: []
                }
            }
        } else {
            result = {
                type: SUSURU_TEXT_ELEMENT_TYPE,
                props: {
                    nodeValue: text.toString(),
                    children: []
                }
            }
        }
        return result;
    }

    // Create dom element for non-functional fiber
    private createDomForSimpleFiber = (fiber: Fiber) => {
        const isText = (fiber.node.type === SUSURU_TEXT_ELEMENT_TYPE);
        if (isText) {
            this.domCounter += 1;
            if (this.hydration) {
                // This should only happen on client side rendering
                const domHydrationId = SSR_PREFIX + this.domCounter;
                const textNodeIterator = document.createNodeIterator(fiber.parent.dom as HTMLElement, NodeFilter.SHOW_COMMENT);
                let curNode;
                while (curNode = textNodeIterator.nextNode()) {
                    if (curNode.nodeValue?.trim() === domHydrationId.trim()) {
                        const dom = curNode.nextSibling;
                        return dom;
                    }
                }
                return null;
            } else {
                const dom = this._document.createTextNode(fiber.node.props?.nodeValue || '');
                return dom;
            }
        } else if (fiber.node.type !== SUSURU_EMPTY_ELEMENT_TYPE) {
            this.domCounter += 1;
            const domHydrationId = SSR_PREFIX + this.domCounter;
            const dom = this.hydration ? document.querySelector(`[data-hydration-id='${domHydrationId}']`) as HTMLElement : this._document.createElement(fiber.node.type as Exclude<SusuruElementType, Function>);
            this.updateDom(dom, null, fiber.node);
            return dom;
        } else {
            return null;
        }
    }

    private updateFunctionComponent = (fiber: Fiber) => {
        this.hookController.setFunctionComponentFiber(fiber, this.reRender);
        const result = [(fiber.node.type as Function)(fiber.node.props)];
        // Note: Function components do not have dom set here. Therefore in commit stage, need to find parent's dom
        this.reconcileChildren(fiber, result)
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
            return () => {
                return this.weaveFiber(fiber.child)
            };
        }
        let nextFiber = fiber
        while (nextFiber) {
            if (nextFiber.sibling) {
                return () => {
                    return this.weaveFiber(nextFiber.sibling)
                }
            }
            nextFiber = nextFiber.parent
        }

        // Nothing left to do
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
            const sameType = oldFiber && element && (element.type === oldFiber.node.type)
            if (sameType) {
                // Update if same type, has element and oldfiber
                newFiber = {
                    node: element,
                    dom: oldFiber.dom,
                    parent: wipFiber,
                    previousState: oldFiber,
                    effectTag: "UPDATE",
                }
            } else if (oldFiber?.node.type === SUSURU_EMPTY_ELEMENT_TYPE) {
                // Ignore oldfiber if it was empty.
                // This means that if a new element is inserted, all elements come next will be deleted and placed again.
                oldFiber = oldFiber.sibling;
                continue;
            } else if (element && !sameType) {
                // Place new element if it does not have same type with old fiber.
                // Old fiber will be deleted in the below if statement
                newFiber = {
                    node: element,
                    dom: null,
                    parent: wipFiber,
                    previousState: null,
                    effectTag: "PLACEMENT",
                }
            }

            // Whenever there is old fiber and not same type, delete old fiber
            if (oldFiber && !sameType) {
                oldFiber.effectTag = "DELETION";
                this.deletions.push(oldFiber);
                newFiber = oldFiber.sibling;
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
    private updateDom = (dom: HTMLElement | Text | SSRHtmlElement, oldNode: SusuruElement | null, newNode: SusuruElement) => {
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
            // @ts-ignore
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
            // @ts-ignore
            this.commitDeletion(fiber, domParent)
        }
        // Clear effect tag after executing
        delete fiber.effectTag;
        this.commitWork(fiber.child);
        this.commitWork(fiber.sibling);
    }

    private commitDeletion = (fiber: Fiber, domParent: HTMLElement | Text | SSRHtmlElement) => {
        if (fiber.dom) {
            // @ts-ignore
            domParent.removeChild(fiber.dom)
        } else {
            this.commitDeletion(fiber.child, domParent)
        }
    }

    // render element and mount to container
    public render = (element?: SusuruElement, container?: HTMLElement | SSRHtmlElement, wipRootProvided?: Fiber, onTaskFinished?: () => void) => {
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
        (this.hydration === undefined) && (this.hydration = (container?.childNodes?.[0]?.nodeValue?.trim() === SSR_ROOT_HYDRATION_ID));

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
                onTaskFinished && onTaskFinished();
                this.hydration = false
            }
        })
    }

    public reRender = (onTaskFinished?: () => void): Promise<void> => {
        return new Promise((resolve) => {
            if (!this.currentRoot) {
                resolve()
            }
            const wipRoot = {
                dom: this.currentRoot.dom,
                node: this.currentRoot.node,
                isRoot: true,
                previousState: this.currentRoot
            } as Fiber;
            this.render(undefined, undefined, wipRoot, () => {
                onTaskFinished && onTaskFinished();
                resolve();
            });
        })
    }

    public renderToString = async (element: SusuruElement, containerId: string) => new Promise<{
        htmlString: string,
        dataScript: string
    }>((resolve) => {
        const ssrDocument = new SSRDocument(containerId || DEFAULT_APP_ROOT); // remember to remove
        this._document = ssrDocument; // remember to remove
        const onTaskFinished = (storeData?: object) => {
            const htmlString = ssrDocument.exportString();
            const dataScript = storeData ? `<script>window.__ssr__ = '${JSON.stringify(storeData)}'</script>` : '';
            resolve({
                htmlString,
                dataScript
            });
        }
        this.hookController.setOnUseStoreServerCallbackFinished(onTaskFinished);
        this.render(element, this._document.getRoot(), undefined, () => {
            // If no callback in useStore callback pool, return here
            if(!this.hookController.onServerRenderingCallbackPool.length){
                onTaskFinished();
            }
        });
    }).catch(error => {
        console.error(error);
        Promise.reject({
            htmlString: '',
            dataScript: ''
        });
    }).finally(() => {
        this._document = document; // remember to remove
        this.reset();
    })
}

export default VdomController;