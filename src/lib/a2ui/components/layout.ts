/**
 * Layout Components Creator (Row, Column, List)
 * Semantics match A2UI: alignment = cross axis (align-items), distribution = main axis (justify-content)
 * Ref: A2UI renderers/lit row.ts, column.ts; renderers/angular catalog/row.ts, column.ts
 */

const ALIGNMENT_MAP: Record<string, string> = {
  start: 'align-start',
  center: 'align-center',
  end: 'align-end',
  stretch: 'align-stretch',
};

const DISTRIBUTION_MAP: Record<string, string> = {
  start: 'distribute-start',
  center: 'distribute-center',
  end: 'distribute-end',
  spaceBetween: 'distribute-spaceBetween',
  spaceAround: 'distribute-spaceAround',
  spaceEvenly: 'distribute-spaceEvenly',
};

export function createRowElement(id: string, properties: any): HTMLElement {
  const element = document.createElement('div');
  element.className = 'a2ui-row';
  element.setAttribute('data-component-id', id);

  // alignment = cross axis (align-items). A2UI default "stretch"
  const alignment = (properties.align ?? properties.alignment ?? 'stretch') as string;
  element.classList.add(ALIGNMENT_MAP[alignment] ?? 'align-stretch');

  // distribution = main axis (justify-content). A2UI default "start"
  const distribution = (properties.justify ?? properties.distribution ?? 'start') as string;
  const distClass = DISTRIBUTION_MAP[distribution];
  if (distClass) element.classList.add(distClass);

  return element;
}

export function createColumnElement(id: string, properties: any): HTMLElement {
  const element = document.createElement('div');
  element.className = 'a2ui-column';
  element.setAttribute('data-component-id', id);

  const alignment = (properties.align ?? properties.alignment ?? 'stretch') as string;
  element.classList.add(ALIGNMENT_MAP[alignment] ?? 'align-stretch');

  const distribution = (properties.justify ?? properties.distribution ?? 'start') as string;
  const distClass = DISTRIBUTION_MAP[distribution];
  if (distClass) element.classList.add(distClass);

  return element;
}

export function createListElement(id: string, properties: any, _surfaceId: string): HTMLElement {
  const element = document.createElement('div');
  element.className = 'a2ui-list';
  element.setAttribute('data-component-id', id);

  if (properties.direction) {
    element.classList.add(`list-${properties.direction}`);
  }

  // 标记模板式 children（UI v0.9 ChildList 对象形式）
  if (properties.children && !Array.isArray(properties.children)) {
    const config = properties.children;
    if (config.componentId && config.path) {
      element.dataset.bindingListPath = config.path;
      element.dataset.templateComponentId = config.componentId;
    }
  }

  return element;
}
