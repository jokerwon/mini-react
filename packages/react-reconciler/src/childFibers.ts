import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { Props, ReactElementType } from 'shared/ReactTypes';
import {
  createFiberFromElement,
  createWorkInProgress,
  FiberNode
} from './fiber';
import { ChildDeletion, Placement } from './FiberFlags';
import { HostText } from './workTags';

function ChildReconciler(shouldTrackEffects: boolean) {
  function deleteChild(returnFiber: FiberNode, childToDelete: FiberNode) {
    if (!shouldTrackEffects) return;
    const deletions = returnFiber.deletions;
    if (deletions === null) {
      returnFiber.deletions = [childToDelete];
      returnFiber.flags |= ChildDeletion;
    } else {
      deletions.push(childToDelete);
    }
  }

  function deleteRemainingChildren(
    returnFiber: FiberNode,
    currentFirstChild: FiberNode | null
  ) {
    if (!shouldTrackEffects) {
      return;
    }
    let childToDelete = currentFirstChild;
    while (childToDelete !== null) {
      deleteChild(returnFiber, childToDelete);
      childToDelete = childToDelete.sibling;
    }
  }

  // 单/多节点指 *更新后是单/多节点*
  function reconcileSingleElement(
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    element: ReactElementType
  ): FiberNode {
    const key = element.key;
    while (currentFiber !== null) {
      // update
      if (currentFiber.key === key) {
        if (element.$$typeof === REACT_ELEMENT_TYPE) {
          if (currentFiber.type === element.type) {
            // A1B2C3 --> A1
            // key 和 type 都相同，可以复用
            const existing = useFiber(currentFiber, element.props);
            existing.return = returnFiber;
            // 当前节点可复用，标记剩下的节点删除
            deleteRemainingChildren(returnFiber, currentFiber.sibling);
            return existing;
          }
          // key 相同，type 不同，
          // 无法复用所有节点，删除所有旧节点
          deleteRemainingChildren(returnFiber, currentFiber);
          break;
        } else {
          if (__DEV__) {
            console.warn('unimplemented type', element);
            break;
          }
        }
      } else {
        // key 不同
        // 无法复用当前节点，删除旧节点
        deleteChild(returnFiber, currentFiber);
        // 继续遍历兄弟节点，寻找可复用节点
        currentFiber = currentFiber.sibling;
      }
    }
    // 未找到可复用节点，创建新节点
    // 根据 ReactElement 创建 Fiber
    const fiber = createFiberFromElement(element);
    // 与父节点建立连接
    fiber.return = returnFiber;
    return fiber;
  }
  function reconcileSingleTextNode(
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    content: string | number
  ) {
    while (currentFiber !== null) {
      // update
      if (currentFiber.tag === HostText) {
        // 类型没变，可以复用
        const existing = useFiber(currentFiber, { content });
        existing.return = returnFiber;
        deleteRemainingChildren(returnFiber, currentFiber.sibling);
        return existing;
      }
      // 无法复用，删除旧节点
      deleteChild(returnFiber, currentFiber);
      // 继续遍历兄弟节点，寻找可复用节点
      currentFiber = currentFiber.sibling;
    }
    // 未找到可复用节点，创建新节点
    // 根据 ReactElement 创建 Fiber
    const fiber = new FiberNode(HostText, { content }, null);
    // 与父节点建立连接
    fiber.return = returnFiber;
    return fiber;
  }

  // 添加 Placement flag
  function placeSingleChild(fiber: FiberNode) {
    if (shouldTrackEffects && fiber.alternate === null) {
      // fiber.alternate === null 说明是首屏渲染
      fiber.flags |= Placement;
    }
    return fiber;
  }

  return function reconcileChildFibers(
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    newChild?: ReactElementType
  ) {
    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(
            reconcileSingleElement(returnFiber, currentFiber, newChild)
          );
        default:
          if (__DEV__) {
            console.warn(
              'reconcileChildFibers',
              'unimplemented type',
              newChild
            );
          }
          break;
      }
    }
    // HostText
    if (typeof newChild === 'string' || typeof newChild === 'number') {
      return placeSingleChild(
        reconcileSingleTextNode(returnFiber, currentFiber, newChild)
      );
    }

    if (currentFiber !== null) {
      // 兜底
      // 其他类型直接删除
      deleteChild(returnFiber, currentFiber);
    }

    if (__DEV__) {
      console.warn('reconcileChildFibers', 'unimplemented type', newChild);
    }
    return null;
  };
}

// 复用 fiber
function useFiber(fiber: FiberNode, pendingProps: Props) {
  const clone = createWorkInProgress(fiber, pendingProps);
  clone.index = 0;
  clone.sibling = null;
  return clone;
}

export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);
