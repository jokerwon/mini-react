import { ReactElementType } from 'shared/ReactTypes';
import { mountChildFibers, reconcileChildFibers } from './childFibers';
import { FiberNode } from './fiber';
import { processUpdateQueue, UpdateQueue } from './updateQueue';
import {
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText
} from './workTags';
import { renderWithHooks } from './fiberHooks';

// 递归中的递阶段
// 比较子Fiber和子ReactElement，返回子FiberNode
// <A><B/></A>
// 进入A的beginWork时，对比B的 current Fiber和B的 ReactElement，生成B的 wip Fiber
export const beginWork = (wip: FiberNode): FiberNode | null => {
  switch (wip.tag) {
    case HostRoot:
      // 1. 计算状态的最新值
      // 2. 创造子fiberNode
      return updateHostRoot(wip);
    case HostComponent:
      return updateHostComponent(wip);
    case FunctionComponent:
      return updateFunctionComponent(wip);
    case HostText:
      // 文本节点没有子节点
      return null;
    default:
      if (__DEV__) {
        console.warn('beginWork', 'unimplemented tag');
      }
      break;
  }
  return null;
};

function updateHostRoot(wip: FiberNode) {
  // 1. 计算状态的最新值
  const baseState = wip.memoizedState;
  const updateQueue = wip.updateQueue as UpdateQueue<Element>;
  const pending = updateQueue.shared.pending;
  updateQueue.shared.pending = null;

  const { memoizedState } = processUpdateQueue(baseState, pending);
  wip.memoizedState = memoizedState;

  // 子ReactElement
  // 因为 updateContainer 时将 element 保存到了 shared.pending 中
  const nextChildren = wip.memoizedState;
  // 2. 创造子fiberNode
  reconcileChildren(wip, nextChildren);
  return wip.child;
}

function updateHostComponent(wip: FiberNode) {
  const nextProps = wip.pendingProps;
  const nextChildren = nextProps.children;
  reconcileChildren(wip, nextChildren);
  return wip.child;
}

function updateFunctionComponent(wip: FiberNode) {
  const nextChildren = renderWithHooks(wip);
  reconcileChildren(wip, nextChildren);
  return wip.child;
}

function reconcileChildren(wip: FiberNode, children?: ReactElementType) {
  const current = wip.alternate;

  if (current !== null) {
    // update
    wip.child = reconcileChildFibers(wip, current?.child, children);
  } else {
    // mount
    wip.child = mountChildFibers(wip, null, children);
  }
}
