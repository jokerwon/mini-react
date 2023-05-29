import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { Props, ReactElementType } from 'shared/ReactTypes';
import {
  createFiberFromElement,
  createWorkInProgress,
  FiberNode
} from './fiber';
import { ChildDeletion, Placement } from './FiberFlags';
import { HostText } from './workTags';

type ExistingChildren = Map<string | number, FiberNode>;

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

  function reconcileChildrenArray(
    returnFiber: FiberNode,
    currentFirstChild: FiberNode | null,
    newChild: any[]
  ) {
    // 保存最后一个被复用且不用移动的节点在 current(当前层级 fiber 链表) 中的 index
    let lastPlacedIndex = 0;
    // 创建的最后一个 fiber
    let lastNewFiber: FiberNode | null = null;
    // 创建的第一个 fiber
    let firstNewFiber: FiberNode | null = null;

    // 1. 将 current 中所有同级 fiber 保存在 Map 中
    const existingChildren: ExistingChildren = new Map();
    let current = currentFirstChild;
    while (current !== null) {
      const keyToUse = current.key !== null ? current.key : current.index;
      existingChildren.set(keyToUse, current);
      current = current.sibling;
    }
    // 2. 遍历newChild数组，对于每个遍历到的element，存在两种情况：
    //    - 在Map中存在对应current fiber，且可以复用
    //    - 在Map中不存在对应current fiber，或不能复用
    for (let i = 0; i < newChild.length; i++) {
      const after = newChild[i];
      // 是否可复用
      const newFiber = updateFromMap(returnFiber, existingChildren, i, after);
      if (newFiber === null) {
        continue;
      }
      // 3. 判断是插入还是移动
      newFiber.index = i;
      newFiber.return = returnFiber;

      if (lastNewFiber === null) {
        lastNewFiber = newFiber;
        firstNewFiber = newFiber;
      } else {
        lastNewFiber.sibling = newFiber;
        lastNewFiber = lastNewFiber.sibling;
      }
      if (!shouldTrackEffects) {
        continue;
      }

      const current = newFiber.alternate;
      if (current !== null) {
        const oldIndex = current.index;
        if (oldIndex < lastPlacedIndex) {
          // 移动
          newFiber.flags |= Placement;
          continue;
        } else {
          // 更新前后相对顺序一致，无需移动
          // 因为更新后这个新节点一定在上一个可复用新节点的右边，oldIndex >= lastPlacedIndex 说明更新前也是在上个复用节点的右边
          // ABC --> BCA  对于 C 节点，lastPlacedIndex = 1, oldIndex = 2, C 和 B 的相对顺序一致，所以 C 节点不用移动
          lastPlacedIndex = oldIndex;
        }
      } else {
        // mount
        newFiber.flags |= Placement;
      }
    }

    // 4. 最后Map中剩下的都标记删除
    existingChildren.forEach((fiber) => {
      deleteChild(returnFiber, fiber);
    });
    return firstNewFiber;
  }

  function updateFromMap(
    returnFiber: FiberNode,
    existingChildren: ExistingChildren,
    index: number,
    element: any
  ): FiberNode | null {
    const keyToUse = element.key !== null ? element.key : index;
    const before = existingChildren.get(keyToUse);
    // HostText
    if (typeof element === 'string' || typeof element === 'number') {
      if (before) {
        if (before.tag === HostText) {
          existingChildren.delete(keyToUse);
          return useFiber(before, { content: element + '' });
        }
      }
      return new FiberNode(HostText, { content: element + '' }, null);
    }
    // ReactElement
    if (typeof element === 'object' && element !== null) {
      switch (element.$$typeof) {
        case REACT_ELEMENT_TYPE:
          if (before) {
            if (before.type === element.type) {
              // 可以复用
              existingChildren.delete(keyToUse);
              return useFiber(before, element.props);
            }
          }
          return createFiberFromElement(element);
        default:
          break;
      }

      // TODO: 数组类型
      if (Array.isArray(element) && __DEV__) {
        console.warn('还未实现数组类型的 child');
      }
    }
    return null;
  }

  return function reconcileChildFibers(
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    newChild?: ReactElementType
  ) {
    if (typeof newChild === 'object' && newChild !== null) {
      // 多节点
      if (Array.isArray(newChild)) {
        return reconcileChildrenArray(returnFiber, currentFiber, newChild);
      }
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
