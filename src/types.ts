export type SusuruText = string;
export type SusuruElementType = (keyof HTMLElementTagNameMap) | SusuruText;

export interface SusuruElement {
  type: SusuruElementType
  props: Record<string, any> & { children?: SusuruElement[] }
  key?: string
}


