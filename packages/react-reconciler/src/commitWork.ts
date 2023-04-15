import { Container, appendChildToContainer } from 'hostConfig';
import { MutationMask, NoFlags, Placement } from './FiberFlags';
import { FiberNode } from './fiber';
import { HostComponent, HostRoot, HostText } from './workTags';
import { FiberRootNode } from './fiber';

let nextEffect: FiberNode | null;

export const commitMutationEffects = (finishedWork: FiberNode) => {
  nextEffect = finishedWork;

  while (nextEffect !== null) {
    const child: FiberNode | null = nextEffect.child;

    /**
     * 如果子树的 subtreeFlags 有副作用则继续往下遍历，直到找到第一个子树没有副作用的节点
     */
    if (
      (nextEffect.subtreeFlags & MutationMask) !== NoFlags &&
      child !== null
    ) {
      // 继续向子节点遍历
      nextEffect = child;
    } else {
      // 向上遍历（DFS）
      // 有兄弟节点就遍历兄弟节点这颗子树，否则遍历父节点
      up: while (nextEffect !== null) {
        commitMutationEffectsOnFiber(nextEffect);
        const sibling: FiberNode | null = nextEffect.sibling;
        if (sibling !== null) {
          nextEffect = sibling;
          break up;
        }
        nextEffect = nextEffect.return;
      }
    }
  }
};

const commitMutationEffectsOnFiber = (finishedWork: FiberNode) => {
  const flags = finishedWork.flags;

  if ((flags & Placement) !== NoFlags) {
    commitPlacement(finishedWork);
    finishedWork.flags &= ~Placement;
  }
};

const commitPlacement = (finishedWork: FiberNode) => {
  // 发现父级 DOM
  if (__DEV__) {
    console.warn('执行 Placement 操作', finishedWork);
  }
  // parent DOM
  const hostParent = getHostParent(finishedWork);
  // finishedWork ==> hostParent
  appendPlacementNodeIntoContainer(finishedWork, hostParent);
};

function getHostParent(fiber: FiberNode) {
  let parent = fiber.return;
  while (parent !== null) {
    const parentTag = parent.tag;
    if (parentTag === HostComponent) {
      return parent.stateNode as Container;
    }
    if (parentTag === HostRoot) {
      // hostRootFiber 的 stateNode 指向了 fiberRootNode，而 fiberRootNode.container 就是要找的挂载父容器
      return (parent.stateNode as FiberRootNode).container as Container;
    }
    parent = parent.return;
  }
  if (__DEV__) {
    console.warn('未找到 host parent', fiber);
  }
}

function appendPlacementNodeIntoContainer(
  finishedWork: FiberNode,
  hostParent: Container
) {
  // finishedWork 有可能不是 HostComponent | HostText，不存在对应的真实 DOM，需要遍历查找到其第一个 HostComponent 的子节点
  if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
    appendChildToContainer(finishedWork.stateNode, hostParent);
    return;
  }
  const child = finishedWork.child;
  while (child !== null) {
    appendPlacementNodeIntoContainer(child, hostParent);

    let sibling = child.sibling;
    while (sibling !== null) {
      appendPlacementNodeIntoContainer(sibling, hostParent);
      sibling = sibling.sibling;
    }
  }
}
