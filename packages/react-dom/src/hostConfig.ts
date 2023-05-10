import { updateFiberProps, DOMElement } from './SyntheticEvent';

export type Container = Element;
export type Instance = Element;
export type TextInstance = Text;

export const createInstance = (type: string, props: any): Instance => {
  // TODO: resolve props
  const element = document.createElement(type) as unknown;
  updateFiberProps(element as DOMElement, props);
  return element as DOMElement;
};

export const createTextInstance = (content: string) => {
  const textNode = document.createTextNode(content);
  return textNode;
};

export const appendInitialChild = (
  parent: Instance | Container,
  child: Instance
) => {
  parent.appendChild(child);
};

export const appendChildToContainer = appendInitialChild;

export const commitTextUpdate = (
  textInstance: TextInstance,
  content: string
) => {
  textInstance.textContent = content;
};

export function removeChild(
  child: Instance | TextInstance,
  container: Container
) {
  container.removeChild(child);
}
