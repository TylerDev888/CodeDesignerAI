export interface PointerRef {
  instrAddr: number;
  kind: "load" | "store" | "jump" | "call";
  baseReg: string;
  baseValue: number;
  offset: number;
  targetAddr: number;
  size?: number;
  type?: string;
  isFunction?: boolean;
  dataType?: string;
}