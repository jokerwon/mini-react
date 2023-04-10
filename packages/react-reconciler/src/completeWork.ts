import { createInstance } from 'hostConfig';
import { FiberNode } from './fiber';
import { HostComponent, HostRoot, HostText } from './workTags';

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
      }
      return null;
    case HostText:
      return null;
    case HostRoot:
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
  //
}
