export type WorkTag =
  | typeof FunctionComponent
  | typeof HostRoot
  | typeof HostComponent
  | typeof HostText
  | typeof Fragment;

export const FunctionComponent = 0;
export const HostRoot = 3; // 与 fiberRootNode 连接的 fiber 节点
// <div></div>
export const HostComponent = 5;
// <div>Hello</div> 中的 Hello
export const HostText = 6;
export const Fragment = 7;
