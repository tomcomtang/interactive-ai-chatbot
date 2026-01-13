/**
 * A2UI Renderer - 基于 A2UI v0.9 协议的渲染引擎
 * 支持声明式 UI 渲染和数据绑定
 */

interface A2UIMessage {
  type: 'createSurface' | 'updateComponents' | 'updateDataModel' | 'deleteSurface';
  surfaceId?: string;
  components?: any[];
  dataModel?: Record<string, any>;
}

export class A2UIRenderer {
  private container: HTMLElement;
  private surfaces: Map<string, HTMLElement> = new Map();
  private dataModels: Map<string, any> = new Map();
  private componentElements: Map<string, HTMLElement> = new Map();

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * 处理 A2UI 消息
   */
  processMessage(message: A2UIMessage) {
    switch (message.type) {
      case 'createSurface':
        this.createSurface(message.surfaceId!, message.components!, message.dataModel);
        break;
      case 'updateComponents':
        this.updateComponents(message.surfaceId!, message.components!);
        break;
      case 'updateDataModel':
        this.updateDataModel(message.surfaceId!, message.dataModel!);
        break;
      case 'deleteSurface':
        this.deleteSurface(message.surfaceId!);
        break;
    }
  }

  /**
   * 创建 Surface
   */
  private createSurface(surfaceId: string, components: any[], dataModel?: any) {
    const surfaceEl = document.createElement('div');
    surfaceEl.className = 'a2ui-surface';
    surfaceEl.dataset.surfaceId = surfaceId;

    // 存储数据模型
    if (dataModel) {
      this.dataModels.set(surfaceId, dataModel);
    }

    // 渲染组件
    components.forEach(comp => {
      const compEl = this.renderComponent(comp, surfaceId);
      if (compEl) {
        surfaceEl.appendChild(compEl);
      }
    });

    this.surfaces.set(surfaceId, surfaceEl);
    this.container.appendChild(surfaceEl);
  }

  /**
   * 更新组件
   */
  private updateComponents(surfaceId: string, components: any[]) {
    const surface = this.surfaces.get(surfaceId);
    if (!surface) return;

    // 清空并重新渲染
    surface.innerHTML = '';
    components.forEach(comp => {
      const compEl = this.renderComponent(comp, surfaceId);
      if (compEl) {
        surface.appendChild(compEl);
      }
    });
  }

  /**
   * 更新数据模型
   */
  private updateDataModel(surfaceId: string, dataModel: any) {
    const existingModel = this.dataModels.get(surfaceId) || {};
    this.dataModels.set(surfaceId, { ...existingModel, ...dataModel });

    // 重新渲染所有绑定了数据的组件
    const surface = this.surfaces.get(surfaceId);
    if (surface) {
      this.updateBoundComponents(surface, surfaceId);
    }
  }

  /**
   * 删除 Surface
   */
  private deleteSurface(surfaceId: string) {
    const surface = this.surfaces.get(surfaceId);
    if (surface) {
      surface.remove();
      this.surfaces.delete(surfaceId);
      this.dataModels.delete(surfaceId);
    }
  }

  /**
   * 渲染单个组件
   */
  private renderComponent(comp: any, surfaceId: string): HTMLElement | null {
    const { type, id } = comp;

    switch (type) {
      case 'Text':
        return this.renderText(comp, surfaceId);
      case 'Image':
        return this.renderImage(comp, surfaceId);
      case 'Divider':
        return this.renderDivider(comp);
      case 'Row':
        return this.renderRow(comp, surfaceId);
      case 'Column':
        return this.renderColumn(comp, surfaceId);
      case 'List':
        return this.renderList(comp, surfaceId);
      case 'Card':
        return this.renderCard(comp, surfaceId);
      case 'Button':
        return this.renderButton(comp, surfaceId);
      case 'TextField':
        return this.renderTextField(comp, surfaceId);
      case 'CheckBox':
        return this.renderCheckBox(comp, surfaceId);
      case 'Slider':
        return this.renderSlider(comp, surfaceId);
      default:
        console.warn(`Unknown component type: ${type}`);
        return null;
    }
  }

  /**
   * 渲染 Text 组件
   */
  private renderText(comp: any, surfaceId: string): HTMLElement {
    const el = document.createElement('p');
    el.className = `a2ui-text text-${comp.size || 'medium'}`;
    el.dataset.componentId = comp.id;

    // 如果 text 以 / 开头，则解析 dataBinding；否则直接使用静态文本
    let text: string;
    if (comp.text && comp.text.startsWith('/')) {
      text = this.resolveBinding(comp.text, surfaceId) ?? '';
    } else {
      text = comp.text ?? '';
    }
    el.textContent = String(text);

    if (comp.style?.color) {
      el.style.color = comp.style.color;
    }
    if (comp.style?.fontWeight) {
      el.style.fontWeight = comp.style.fontWeight;
    }

    return el;
  }

  /**
   * 渲染 Image 组件
   */
  private renderImage(comp: any, surfaceId: string): HTMLElement {
    const el = document.createElement('img');
    el.className = 'a2ui-image';
    
    // 支持 dataBinding，优先使用 dataBinding 解析的值
    const url = comp.dataBinding 
      ? this.resolveBinding(comp.dataBinding, surfaceId) 
      : comp.url;
    el.src = url || '';
    el.alt = comp.alt || '';
    
    if (comp.width) el.style.width = comp.width;
    if (comp.height) el.style.height = comp.height;

    return el;
  }

  /**
   * 渲染 Divider 组件
   */
  private renderDivider(comp: any): HTMLElement {
    const el = document.createElement('hr');
    el.className = `a2ui-divider divider-${comp.direction || 'horizontal'}`;
    return el;
  }

  /**
   * 渲染 Row 组件
   */
  private renderRow(comp: any, surfaceId: string): HTMLElement {
    const el = document.createElement('div');
    el.className = `a2ui-row align-${comp.alignment || 'start'}`;
    el.dataset.componentId = comp.id;

    if (comp.children) {
      comp.children.forEach((child: any) => {
        const childEl = this.renderComponent(child, surfaceId);
        if (childEl) el.appendChild(childEl);
      });
    }

    return el;
  }

  /**
   * 渲染 Column 组件
   */
  private renderColumn(comp: any, surfaceId: string): HTMLElement {
    const el = document.createElement('div');
    el.className = `a2ui-column align-${comp.alignment || 'start'}`;
    el.dataset.componentId = comp.id;

    if (comp.children) {
      comp.children.forEach((child: any) => {
        const childEl = this.renderComponent(child, surfaceId);
        if (childEl) el.appendChild(childEl);
      });
    }

    return el;
  }

  /**
   * 渲染 List 组件
   */
  private renderList(comp: any, surfaceId: string): HTMLElement {
    const el = document.createElement('div');
    el.className = 'a2ui-list';
    el.dataset.componentId = comp.id;

    const items = this.resolveBinding(comp.dataBinding, surfaceId);
    
    if (Array.isArray(items) && comp.itemTemplate) {
      items.forEach((item: any, index: number) => {
        // 创建临时数据模型
        const tempModel = { ...this.dataModels.get(surfaceId), item, index };
        const tempSurfaceId = `${surfaceId}_item_${index}`;
        this.dataModels.set(tempSurfaceId, tempModel);

        const itemEl = this.renderComponent(comp.itemTemplate, tempSurfaceId);
        if (itemEl) el.appendChild(itemEl);
      });
    }

    return el;
  }

  /**
   * 渲染 Card 组件
   */
  private renderCard(comp: any, surfaceId: string): HTMLElement {
    const el = document.createElement('div');
    el.className = `a2ui-card elevation-${comp.elevation || 1}`;
    el.dataset.componentId = comp.id;

    if (comp.children) {
      comp.children.forEach((child: any) => {
        const childEl = this.renderComponent(child, surfaceId);
        if (childEl) el.appendChild(childEl);
      });
    }

    return el;
  }

  /**
   * 渲染 Button 组件
   */
  private renderButton(comp: any, surfaceId: string): HTMLElement {
    const el = document.createElement('button');
    el.className = `a2ui-button button-${comp.variant || 'primary'}`;
    el.textContent = comp.text;
    el.dataset.componentId = comp.id;

    if (comp.action) {
      el.addEventListener('click', () => {
        this.handleAction(comp.action, surfaceId);
      });
    }

    return el;
  }

  /**
   * 渲染 TextField 组件
   */
  private renderTextField(comp: any, surfaceId: string): HTMLElement {
    const container = document.createElement('div');
    container.className = 'a2ui-textfield-container';
    container.dataset.componentId = comp.id;

    if (comp.label) {
      const label = document.createElement('label');
      label.className = 'a2ui-textfield-label';
      label.textContent = comp.label;
      container.appendChild(label);
    }

    const input = comp.multiline ? document.createElement('textarea') : document.createElement('input');
    input.className = 'a2ui-textfield-input';
    input.placeholder = comp.placeholder || '';

    if (comp.dataBinding) {
      const value = this.resolveBinding(comp.dataBinding, surfaceId);
      input.value = value || '';

      // 双向绑定
      input.addEventListener('input', () => {
        this.setBindingValue(comp.dataBinding, input.value, surfaceId);
      });
    }

    container.appendChild(input);
    return container;
  }

  /**
   * 渲染 CheckBox 组件
   */
  private renderCheckBox(comp: any, surfaceId: string): HTMLElement {
    const container = document.createElement('label');
    container.className = 'a2ui-checkbox-container';
    container.dataset.componentId = comp.id;

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'a2ui-checkbox-input';

    if (comp.dataBinding) {
      const checked = this.resolveBinding(comp.dataBinding, surfaceId);
      input.checked = !!checked;

      // 双向绑定
      input.addEventListener('change', () => {
        this.setBindingValue(comp.dataBinding, input.checked, surfaceId);
      });
    }

    const label = document.createElement('span');
    label.className = 'a2ui-checkbox-label';
    label.textContent = comp.label || '';

    container.appendChild(input);
    container.appendChild(label);
    return container;
  }

  /**
   * 渲染 Slider 组件
   */
  private renderSlider(comp: any, surfaceId: string): HTMLElement {
    const container = document.createElement('div');
    container.className = 'a2ui-slider-container';
    container.dataset.componentId = comp.id;

    const input = document.createElement('input');
    input.type = 'range';
    input.className = 'a2ui-slider-input';
    input.min = String(comp.min || 0);
    input.max = String(comp.max || 100);
    input.step = String(comp.step || 1);

    const valueDisplay = document.createElement('span');
    valueDisplay.className = 'a2ui-slider-value';

    if (comp.dataBinding) {
      const value = this.resolveBinding(comp.dataBinding, surfaceId);
      input.value = String(value || comp.min || 0);
      valueDisplay.textContent = input.value;

      // 双向绑定
      input.addEventListener('input', () => {
        const numValue = parseFloat(input.value);
        this.setBindingValue(comp.dataBinding, numValue, surfaceId);
        valueDisplay.textContent = input.value;
      });
    }

    container.appendChild(input);
    container.appendChild(valueDisplay);
    return container;
  }

  /**
   * 解析数据绑定（JSON Pointer）
   */
  private resolveBinding(binding: string | undefined, surfaceId: string): any {
    if (!binding) return undefined;

    const dataModel = this.dataModels.get(surfaceId);
    if (!dataModel) return undefined;

    // 简化的 JSON Pointer 解析
    const path = binding.replace(/^\//, '').split('/');
    let value = dataModel;

    for (const key of path) {
      if (value && typeof value === 'object') {
        value = value[key];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * 设置数据绑定的值
   */
  private setBindingValue(binding: string, value: any, surfaceId: string) {
    if (!binding) return;

    const dataModel = this.dataModels.get(surfaceId);
    if (!dataModel) return;

    const path = binding.replace(/^\//, '').split('/');
    let obj = dataModel;

    for (let i = 0; i < path.length - 1; i++) {
      if (!obj[path[i]]) obj[path[i]] = {};
      obj = obj[path[i]];
    }

    obj[path[path.length - 1]] = value;
  }

  /**
   * 更新绑定了数据的组件
   */
  private updateBoundComponents(surface: HTMLElement, surfaceId: string) {
    const components = surface.querySelectorAll('[data-component-id]');
    components.forEach(el => {
      // 这里可以实现更细粒度的更新
      // 目前简化处理
    });
  }

  /**
   * 处理 Action
   */
  private handleAction(action: any, surfaceId: string) {
    const dataModel = this.dataModels.get(surfaceId);
    
    // 触发自定义事件
    const event = new CustomEvent('a2ui:action', {
      detail: {
        actionName: action.name,
        actionData: action.data,
        dataModel
      }
    });
    this.container.dispatchEvent(event);
  }

  /**
   * 清空所有内容
   */
  clear() {
    this.container.innerHTML = '';
    this.surfaces.clear();
    this.dataModels.clear();
    this.componentElements.clear();
  }
}
