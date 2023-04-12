import { Key, Props, ReactElementType, Ref } from 'shared/ReactTypes';
import { Flags, NoFlags } from './FiberFlags';
import { FunctionComponent, HostComponent, WorkTag } from './workTags';
import { Container } from 'hostConfig';

export class FiberNode {
  type: any;
  tag: WorkTag;
  pendingProps: Props;
  key: Key;
  stateNode: any;
  ref: Ref;

  return: FiberNode | null;
  sibling: FiberNode | null;
  child: FiberNode | null;
  index: number;

  memoizedProps: Props | null;
  memoizedState: any;
  alternate: FiberNode | null;
  flags: Flags;
  subtreeFlags: Flags;
  updateQueue: unknown;

  constructor(tag: WorkTag, pendingProps: Props, key: Key) {
    this.tag = tag;
    this.key = key;
    // HostComponent 就是它的 dom
    this.stateNode = null;
    // FunctionComponent 就是它本身
    this.type = null;

    // 构成树状结构
    // 指向父 FiberNode
    this.return = null;
    this.sibling = null;
    this.child = null;
    // 在同级中的索引
    this.index = 0;

    this.ref = null;

    // 作为工作单元
    this.pendingProps = pendingProps; // 工作开始之前的 props
    this.memoizedProps = null;
    this.memoizedState = null;
    this.updateQueue = null;

    this.alternate = null;
    // 辅作用标记
    this.flags = NoFlags;
    this.subtreeFlags = NoFlags;
  }
}

export class FiberRootNode {
  // 不能直接使用 Element, 因为需要考虑非浏览器环境
  container: Container; // 挂载 React 应用的容器
  current: FiberNode;
  finishedWork: FiberNode | null; // 整个更新完成后的 hostRootFiber

  constructor(container: Container, hostRootFiber: FiberNode) {
    this.container = container;
    this.current = hostRootFiber;
    hostRootFiber.stateNode = this;
    this.finishedWork = null;
  }
}

// 根据当前 fiber 构建 wip fiber
export const createWorkInProgress = (
  current: FiberNode,
  pendingProps: Props
): FiberNode => {
  let wip = current.alternate;

  // 首屏渲染时，fiberRootNode.current 指向的 rootFiber 没有任何子Fiber节点（即current Fiber树为空，但是 rootFiber 存在，因为创建容器时就已经创建了）。
  if (wip === null) {
    // mount
    wip = new FiberNode(current.tag, pendingProps, current.key);
    wip.stateNode = current.stateNode;
    wip.alternate = current;
    current.alternate = wip;
  } else {
    // update
    wip.pendingProps = pendingProps;
    wip.flags = NoFlags;
    wip.subtreeFlags = NoFlags;
  }

  wip.type = current.type;
  wip.updateQueue = current.updateQueue;
  wip.child = current.child;
  wip.memoizedProps = current.memoizedProps;
  wip.memoizedState = current.memoizedState;

  return wip;
};

export function createFiberFromElement(element: ReactElementType): FiberNode {
  const { type, props, key } = element;
  let fiberTag: WorkTag = FunctionComponent;
  if (typeof type === 'string') {
    // <div></div>
    fiberTag = HostComponent;
  } else if (typeof type !== 'function' && __DEV__) {
    console.warn('createFiberFromElement', 'unimplemented type', element);
  }
  const fiber = new FiberNode(fiberTag, props, key);
  fiber.type = type;
  return fiber;
}
