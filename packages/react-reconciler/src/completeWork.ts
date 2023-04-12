import { createInstance, createTextInstance } from 'hostConfig';
import { FiberNode } from './fiber';
import { HostComponent, HostRoot, HostText } from './workTags';
import { appendInitialChild } from 'hostConfig';
import { NoFlags } from './FiberFlags';

// 递归中的归阶段
// - 构建离屏DOM树
// - 标记 Update flag（TODO）
export const completeWork = (wip: FiberNode) => {
  const newProps = wip.pendingProps;
  const current = wip.alternate;

  switch (wip.tag) {
    case HostComponent:
      if (current !== null && wip.stateNode) {
        // update
      } else {
        // mount
        // 构建DOM
        const instance = createInstance(wip.type, newProps);
        // 插入到DOM树中
        appendAllChildren(instance, wip);
        wip.stateNode = instance;
      }
      bubbleProperties(wip);
      return null;
    case HostText:
      if (current !== null && wip.stateNode) {
        // update
      } else {
        // mount
        // 构建DOM
        const instance = createTextInstance(newProps.content);
        wip.stateNode = instance;
      }
      bubbleProperties(wip);
      return null;
    case HostRoot:
      bubbleProperties(wip);
      return null;

    default:
      if (__DEV__) {
        console.warn('completeWork', 'unimplemented tag');
      }
      break;
  }
  return null;
};

function appendAllChildren(parent: FiberNode, wip: FiberNode) {
  let node = wip.child;

  while (node !== null) {
    if (node?.tag === HostComponent || node?.tag === HostText) {
      appendInitialChild(parent, node.stateNode);
    } else if (node.child !== null) {
      // 往下寻找真实的 DOM 节点
      node.child.return = node;
      node = node.child;
      continue;
    }

    while (node.sibling === null) {
      if (node.return === null || node.return === wip) {
        return;
      }
      // 归
      node = node?.return;
    }

    if (node === wip) {
      return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
}

function bubbleProperties(wip: FiberNode) {
  let subtreeFlags = NoFlags;
  let child = wip.child;

  while (child !== null) {
    subtreeFlags |= child.subtreeFlags;
    subtreeFlags |= child?.flags;

    child.return = wip;
    child = child.sibling;
  }
  wip.subtreeFlags |= subtreeFlags;
}