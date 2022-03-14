import { Fiber } from "./types";

class HookController {
    private hookIndex: number = null;
    private wipFiber: Fiber = null;
    private onTriggerRender: () => void;

    public setFunctionComponentFiber = (wipFiber: Fiber, onTriggerRender: () => void) => {
        this.wipFiber = wipFiber;
        this.wipFiber.hooks = [];
        this.hookIndex = 0;
        this.onTriggerRender = onTriggerRender;
    }
    public useState = <T>(initialState: T): [T, (s: T) => void] => {
        const oldHook = this.wipFiber?.previousState?.hooks?.[this.hookIndex]
        const hook = {
            state: oldHook ? oldHook.state : initialState as T,
            nextState: [] as T[],
        };
        if ((oldHook?.nextState?.length || 0) > 0) {
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
    public useMounted = (onMounted: () => () => void): void => {
        const oldHook = this.wipFiber?.previousState?.hooks?.[this.hookIndex]
        const hook = {
            onUnmount: oldHook?.onUnmount
        }
        if (!hook?.onUnmount) {
            const onUnmount = onMounted();
            hook.onUnmount = onUnmount;
        }
        this.wipFiber.hooks.push(hook)
        this.hookIndex++;
    }
}

export default HookController;