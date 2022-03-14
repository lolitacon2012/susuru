export type SusuruText = string;
export type SusuruElementType = (keyof HTMLElementTagNameMap) | SusuruText | Function

export interface SusuruElement {
  type: SusuruElementType
  props: Record<string, any> & { children?: SusuruElement[] }
  key?: string
}

export interface Fiber {
  dom?: HTMLElement | Text
  node: SusuruElement
  parent?: Fiber
  sibling?: Fiber
  child?: Fiber
  isRoot?: boolean
  previousState?: Fiber
  effectTag?: string
  hooks?: any[]
}