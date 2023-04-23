import { Action } from 'shared/ReactTypes';

export interface Dispatcher {
  /**
   * @example
   * const [num, setNum] = useState<number>(() => 10)
   * setNum(11)
   * setNum(prev => prev + 1)
   */
  useState: <T>(initialState: (() => T) | T) => [T, Dispatch<T>];
}
export type Dispatch<State> = (action: Action<State>) => void;

// 共享 Dispatcher
const currentDispatcher: { current: Dispatcher | null } = {
  current: null
};

export const resolveDispatcher = () => {
  const dispatcher = currentDispatcher.current;

  if (dispatcher === null) {
    throw new Error('hook 只能在函数组件中执行');
  }

  return dispatcher;
};

export default currentDispatcher;
