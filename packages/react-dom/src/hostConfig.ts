export type Container = Element;
export type Instance = Element;

export const createInstance = (type: string, props: any): Instance => {
  // TODO: resolve props
  const element = document.createElement(type);
  return element;
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
