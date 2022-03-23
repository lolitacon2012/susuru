import { SSRHtmlElement } from "./ssrDocument";

export type SusuruText = string;
export type SusuruElementType = (keyof HTMLElementTagNameMap) | SusuruText | Function

export interface SusuruElement {
  type: SusuruElementType
  props: Record<string, any> & { 
    children?: SusuruElement[],
  }
  key?: string
}

export interface Fiber {
  dom?: HTMLElement | Text | SSRHtmlElement
  node: SusuruElement
  parent?: Fiber
  sibling?: Fiber
  child?: Fiber
  isRoot?: boolean
  previousState?: Fiber
  effectTag?: string
  hooks?: Hook[]
  onDelete?: () => void
}

export type Hook = StateHook<any> | EffectHook | StoreHook<any> | RouterRegisterHook;
export type StateHook<T> = {
  state: T,
  nextState: T[]
}
export type EffectHook = {
  onUnmount?: () => void,
  dependencies: any[]
}
export type StoreHook<T extends object> = {
  id: number,
  store: ProxyHandler<T>,
  onServerRenderingExecuted: boolean,
}

export type RouterRegisterHook = {
  path: string,
}