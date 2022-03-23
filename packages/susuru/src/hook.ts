import { NOOP } from "./constants";
import { EffectHook, Fiber, StateHook, StoreHook, RouterRegisterHook } from "./types";
import { isServer, proxyHandlerFactory } from "./utils";
import lodashMerge from 'lodash.merge';

type ServerSideStoreHydrationData = {
    [key: string | number]: string | number | ServerSideStoreHydrationData
}

class StatefulHookController {
    private hookIndex: number = null;
    private wipFiber: Fiber = null;
    private onTriggerRender: (cb?: () => void) => Promise<void>;
    private pendingUseStoreServerCallbackCounter: number = 0;
    private onUseStoreServerCallbackFinished: (storeData: ServerSideStoreHydrationData) => void;
    private serverSideStoreHydrationData: ServerSideStoreHydrationData = {}; // Used both on server side and client side. key: store hook id, value: store data
    private switchComponent: Function;
    // store counter. This value is global, which makes hook controller stateful.
    private storeCounter: number = undefined;

    constructor() {
        if (!isServer) {
            try {
                // @ts-ignore
                const ssrInitialValueString = JSON.parse((!isServer && window.__ssr__));
                this.serverSideStoreHydrationData = ssrInitialValueString;
            } catch (err) {
                console.log('No server-side initial store value found.')
            }
        }
        this.storeCounter = 0;
    }

    public reset = () => {
        this.wipFiber = undefined;
        this.hookIndex = 0;
        this.onTriggerRender = undefined;
        this.pendingUseStoreServerCallbackCounter = 0;
        this.onUseStoreServerCallbackFinished = undefined;
        this.serverSideStoreHydrationData = {};
        this.storeCounter = 0;
    }

    public setFunctionComponentFiber = (wipFiber: Fiber, onTriggerRender: (cb?: () => void) => Promise<void>) => {
        this.wipFiber = wipFiber;
        this.wipFiber.hooks = [];
        this.hookIndex = 0;
        this.onTriggerRender = onTriggerRender;
    }
    public setOnUseStoreServerCallbackFinished = (callback: (storeData: ServerSideStoreHydrationData) => void) => {
        this.onUseStoreServerCallbackFinished = callback;
    }
    public useState = <T>(initialState: T): [T, (s: T) => void] => {
        const oldHook = this.wipFiber?.previousState?.hooks?.[this.hookIndex] as StateHook<T>;
        const hook: StateHook<T> = {
            state: oldHook ? oldHook.state : initialState,
            nextState: [],
        };
        if ((oldHook?.nextState.length || 0) > 0) {
            hook.state = oldHook.nextState[0];
        }
        const setState = (value: T) => {
            hook.nextState = [value];
            this.onTriggerRender();
        }

        this.wipFiber.hooks.push(hook)
        this.hookIndex++
        return [hook.state, setState]
    }
    public useEffect = (effect?: (() => () => void) | (() => void), dependencies?: any[]): void => {
        // useEffect is ignore on server side rendering
        if (isServer) {
            return;
        }
        const oldHook = this.wipFiber?.previousState?.hooks?.[this.hookIndex] as EffectHook;
        const hook = {
            ...oldHook,
            dependencies,
        }
        const oldDependencies = oldHook?.dependencies || [];
        const newDependencies = dependencies || [];
        if (!oldHook || newDependencies.some((d, i) => d !== oldDependencies[i])) {
            // useEffect should execute after render
            setTimeout(() => {
                const onUnmount = effect();
                hook.onUnmount = onUnmount instanceof Function ? onUnmount : NOOP;
            })
        }
        this.wipFiber.hooks.push(hook)
        this.hookIndex++;
    }

    public useStore = <T extends Record<string | number, any>>(initialStoreObject: T): { store: T, onServerRendering: (asyncCallback: () => Promise<Partial<T>>) => void } => {
        const oldHook = this.wipFiber?.previousState?.hooks?.[this.hookIndex] as StoreHook<T>;
        let initialStore: ProxyHandler<T>;
        const currentNewStoreId = this.storeCounter;
        if (!oldHook?.store) {
            const initialValue = initialStoreObject;
            const ssrInitialValue = this.serverSideStoreHydrationData?.[currentNewStoreId] || {};
            lodashMerge(initialValue, ssrInitialValue);
            initialStore = new Proxy<T>(initialValue, proxyHandlerFactory(() => {
                this.onTriggerRender()
            }));
            this.storeCounter++
        }
        const hook = {
            id: oldHook ? oldHook.id : currentNewStoreId,
            store: oldHook ? oldHook.store : initialStore,
            onServerRenderingExecuted: !!oldHook?.onServerRenderingExecuted
        };
        this.wipFiber.hooks.push(hook)
        this.hookIndex++
        // onServerRendering should only execute once
        const onServerRendering = (asyncCallback: () => Promise<Partial<T>>) => {

            if (isServer && !hook.onServerRenderingExecuted) {
                this.pendingUseStoreServerCallbackCounter = this.pendingUseStoreServerCallbackCounter + 1;
                hook.onServerRenderingExecuted = true;
                asyncCallback().then((partialStore) => {
                    this.serverSideStoreHydrationData[currentNewStoreId] = partialStore;
                    // how to set store again here??? now store is being set in component
                }).catch(err => {
                    console.error(err);
                }).finally(() => {
                    this.pendingUseStoreServerCallbackCounter = this.pendingUseStoreServerCallbackCounter - 1;
                    if (this.pendingUseStoreServerCallbackCounter === 0) {
                        this.onTriggerRender().then(() => {
                            this.onUseStoreServerCallbackFinished && this.onUseStoreServerCallbackFinished(this.serverSideStoreHydrationData);
                            this.reset();
                        })
                    }
                })
            }
        }
        return { store: hook.store as T, onServerRendering };
    }

    // Takes in a map of routes and components, return a functional component that renders corresponding routing
    public useRouterRegister = (routingMap: { [key: string]: Function }, defaultComponent?: Function, currentPath?: string): { Switch: Function } => {

        // For now it only execute once, so no need to care about old hook. Maybe in the future can let it act like useEffect
        const oldHook = this.wipFiber?.previousState?.hooks?.[this.hookIndex] as RouterRegisterHook;
        // TODO: support params
        const _currentPath = isServer ? currentPath : window.location.pathname;
        const previousPath = oldHook?.path;
        const pathHandlingChanged = _currentPath !== previousPath;
        let hook = {
            ...oldHook,
            path: _currentPath
        }

        if (pathHandlingChanged) {
            this.switchComponent = routingMap[_currentPath] || defaultComponent || (() => null)
            setTimeout(() => {
                // TODO: get rid of flashing here
                this.onTriggerRender && this.onTriggerRender();
            })
        }
        this.wipFiber.hooks.push(hook)
        this.hookIndex++;

        return { Switch: this.switchComponent }
    }

    private routerFunctions = {
        push: (path: string) => {
            history.pushState({}, "", path);
            this.onTriggerRender();
        }
    }

    public useRouter = (): { push: (path: string) => void } => {

        if (!isServer && !window.onpopstate) {
            window.onpopstate = () => this.onTriggerRender();
        }
        return this.routerFunctions;
    }
}

export default StatefulHookController;