import {
  Container,
  appendChildToContainer,
  commitTextUpdate,
  removeChild
} from 'hostConfig';
import {
  ChildDeletion,
  MutationMask,
  NoFlags,
  Placement,
  Update
} from './FiberFlags';
import { FiberNode } from './fiber';
import {
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText
} from './workTags';
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
  if ((flags & Update) !== NoFlags) {
    commitUpdate(finishedWork);
    finishedWork.flags &= ~Update;
  }
  if ((flags & ChildDeletion) !== NoFlags) {
    const deletions = finishedWork.deletions;
    if (deletions !== null) {
      deletions.forEach((childToDelete) => {
        commitDeletion(childToDelete);
      });
    }
    finishedWork.flags &= ~ChildDeletion;
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
  if (hostParent !== null) {
    appendPlacementNodeIntoContainer(finishedWork, hostParent);
  }
};

const commitUpdate = (finishedWork: FiberNode) => {
  switch (finishedWork.tag) {
    case HostText:
      const text = finishedWork.memoizedProps.content;
      commitTextUpdate(finishedWork.stateNode, text);
      break;

    default:
      if (__DEV__) {
        console.warn('unimplemented Update', finishedWork);
      }
      break;
  }
};

const commitDeletion = (childToDelete: FiberNode) => {
  let rootHostNode: FiberNode | null = null;
  // 递归子树，并找到需要删除节点的根 DOM 节点
  // function Child() {
  //   return <div> <span>Hello</span>  </div>
  // }
  // rootHostNode 最终会指向 div 节点
  commitNestedComponent(childToDelete, (unmountFiber) => {
    switch (unmountFiber.tag) {
      case HostComponent:
        if (rootHostNode === null) {
          rootHostNode = unmountFiber;
        }
        // TODO: 解绑 ref
        return;
      case HostText:
        if (rootHostNode === null) {
          rootHostNode = unmountFiber;
        }
        return;
      case FunctionComponent:
        // TODO: useEffect unmount，解绑 ref
        return;
      default:
        if (__DEV__) {
          console.warn('未处理的 unmount 类型', childToDelete);
        }
        break;
    }
  });
  // 移除 rootHostNode 的 DOM
  if (rootHostNode !== null) {
    const hostParent = getHostParent(childToDelete);
    if (hostParent !== null) {
      removeChild((rootHostNode as FiberNode).stateNode, hostParent);
    }
  }
  childToDelete.return = null;
  childToDelete.child = null;
};

function commitNestedComponent(
  root: FiberNode,
  onCommitUnmount: (fiber: FiberNode) => void
) {
  let node = root;
  while (true) {
    onCommitUnmount(node);
    if (node.child !== null) {
      node.child.return = node;
      node = node.child;
      continue;
    }

    // 终止条件
    if (node === root) {
      return;
    }

    while (node.sibling === null) {
      if (node.return === null || node.return === root) {
        return;
      }
      // 向上归
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
}

function getHostParent(fiber: FiberNode): Container | null {
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
  return null;
}

function appendPlacementNodeIntoContainer(
  finishedWork: FiberNode,
  hostParent: Container
) {
  // finishedWork 有可能不是 HostComponent | HostText，不存在对应的真实 DOM，需要遍历查找到其第一个 HostComponent 的子节点
  if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
    appendChildToContainer(hostParent, finishedWork.stateNode);
    return;
  }
  const child = finishedWork.child;
  if (child !== null) {
    appendPlacementNodeIntoContainer(child, hostParent);

    let sibling = child.sibling;
    while (sibling !== null) {
      appendPlacementNodeIntoContainer(sibling, hostParent);
      sibling = sibling.sibling;
    }
  }
}
