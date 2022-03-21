import { NOOP } from "./constants";
import { EffectHook, Fiber, StateHook, StoreHook } from "./types";
import { isServer, proxifyObject } from "./utils";

const proxyHandlerFactory = (
    reRender: () => void
    //setNeedReRender: (n: Boolean) => void
) => {
    const handler = {
        set: function (obj, prop, value) {
            // setNeedReRender(obj[prop] !== value);
            (obj[prop] !== value) && reRender();
            if ((typeof value === 'object') && (value !== null)) {
                value = proxifyObject(value, handler)
            }
            obj[prop] = value;
            return true;
        }
    }
    return handler;
};

class HookController {
    private hookIndex: number = null;
    private wipFiber: Fiber = null;
    private onTriggerRender: (cb?: () => void) => Promise<void>;
    private pendingUseStoreServerCallbackCounter: number = 0;
    private onUseStoreServerCallbackFinished: () => void;
    // public reset = () => {}

    public setFunctionComponentFiber = (wipFiber: Fiber, onTriggerRender: (cb?: () => void) => Promise<void>) => {
        this.wipFiber = wipFiber;
        this.wipFiber.hooks = [];
        this.hookIndex = 0;
        this.onTriggerRender = onTriggerRender;
    }
    public setOnUseStoreServerCallbackFinished = (callback: () => void) => {
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
    // TODO: better handle of nested object types
    public useStore = <T extends Record<string | number, any>>(initialStoreObject: T): { store: T, onServerRendering: (asyncCallback: () => Promise<void>) => void } => {
        const oldHook = this.wipFiber?.previousState?.hooks?.[this.hookIndex] as StoreHook<T>;
        let initialStore: ProxyHandler<T>;
        if (!oldHook?.store) {
            initialStore = new Proxy<T>(initialStoreObject, proxyHandlerFactory(() => {
                this.onTriggerRender()
            }));
        }
        const hook = {
            store: oldHook ? oldHook.store : initialStore,
            onServerRenderingExecuted: !!oldHook?.onServerRenderingExecuted
        };
        this.wipFiber.hooks.push(hook)
        this.hookIndex++
        // onServerRendering should only execute once
        const onServerRendering = (asyncCallback: () => Promise<void>) => {
            if (isServer && !hook.onServerRenderingExecuted) {
                this.pendingUseStoreServerCallbackCounter = this.pendingUseStoreServerCallbackCounter + 1;
                hook.onServerRenderingExecuted = true;
                asyncCallback().then(() => {
                }).catch(err => {
                    console.error(err);
                }).finally(() => {
                    this.pendingUseStoreServerCallbackCounter = this.pendingUseStoreServerCallbackCounter - 1;
                    if (this.pendingUseStoreServerCallbackCounter === 0) {
                        this.onTriggerRender().then(() => {
                            this.onUseStoreServerCallbackFinished && this.onUseStoreServerCallbackFinished();
                        })
                    }
                })
            }
        }
        return { store: hook.store as T, onServerRendering };
    }
}

export default HookController;