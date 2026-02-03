/**
 * A2UI v0.9 Message Handlers - Google Standard Compatible
 */

import type { 
  A2UICreateSurfaceMessage, 
  A2UIUpdateComponentsMessage, 
  A2UIUpdateDataModelMessage, 
  A2UIDeleteSurfaceMessage 
} from './types';
import { ComponentFactory } from './component-factory';
import { PropertyResolver } from './property-resolver';
import { attachButtonChildren } from './components/button';

export class MessageHandlers {
  private container: HTMLElement;
  private surfaces: Map<string, HTMLElement>;
  private dataModels: Map<string, any>;
  private componentElements: Map<string, HTMLElement>;
  private rootComponents: Map<string, string>;
  private componentFactory: ComponentFactory;
  private propertyResolver: PropertyResolver;

  constructor(
    container: HTMLElement,
    surfaces: Map<string, HTMLElement>,
    dataModels: Map<string, any>,
    componentElements: Map<string, HTMLElement>,
    rootComponents: Map<string, string>,
    componentFactory: ComponentFactory,
    propertyResolver: PropertyResolver
  ) {
    this.container = container;
    this.surfaces = surfaces;
    this.dataModels = dataModels;
    this.componentElements = componentElements;
    this.rootComponents = rootComponents;
    this.componentFactory = componentFactory;
    this.propertyResolver = propertyResolver;
  }

  /**
   * Handle createSurface message (v0.9 format)
   */
  handleCreateSurface(data: A2UICreateSurfaceMessage['createSurface']): void {
    let { surfaceId, catalogId } = data;
    if (surfaceId == null || String(surfaceId) === 'undefined') surfaceId = 'main';

    // Create surface container
    const surfaceElement = document.createElement('div');
    surfaceElement.className = 'a2ui-surface';
    surfaceElement.setAttribute('data-surface-id', surfaceId);
    surfaceElement.setAttribute('data-catalog-id', catalogId);
    
    this.container.appendChild(surfaceElement);
    this.surfaces.set(surfaceId, surfaceElement);
    
    // Initialize empty data model
    if (!this.dataModels.has(surfaceId)) {
      this.dataModels.set(surfaceId, {});
    }
    
    console.log(`✅ Created surface: ${surfaceId} with catalog: ${catalogId}`);
  }

  /**
   * Handle updateComponents message (v0.9 format)
   */
  handleUpdateComponents(data: A2UIUpdateComponentsMessage['updateComponents']): void {
    let { surfaceId, components } = data;
    if (surfaceId == null || String(surfaceId) === 'undefined') surfaceId = 'main';

    const surface = this.surfaces.get(surfaceId);
    if (!surface) {
      console.error(`❌ Surface not found: ${surfaceId}`);
      return;
    }

    // Clear existing components for this surface
    this.clearSurfaceComponents(surfaceId);
    
    // Pre-pass: Extract and create inline components from Button children
    // AI sometimes returns inline component objects in Button.children instead of component IDs
    const inlineComponents: any[] = [];
    components.forEach(component => {
      if (component.component === 'Button' && component.children && Array.isArray(component.children)) {
        component.children.forEach((child: any, index: number) => {
          // Check if child is an object (inline component) instead of a string ID
          if (typeof child === 'object' && child.id && child.component) {
            console.log(`🔧 Found inline component in Button ${component.id}:`, child);
            // Create the inline component
            inlineComponents.push(child);
            // Replace the object with its ID in the children array
            component.children[index] = child.id;
          }
        });
      }
    });
    
    // Add inline components to the components array
    if (inlineComponents.length > 0) {
      components.push(...inlineComponents);
      console.log(`📦 Added ${inlineComponents.length} inline components from Button children`);
    }
    
    // First pass: Create all components without children
    components.forEach(component => {
      try {
        const element = this.componentFactory.createComponent(component, surfaceId);
        this.componentElements.set(component.id, element);
        console.log(`✅ Created component: ${component.id} (${component.component})`);
      } catch (error) {
        console.error(`❌ Failed to create component ${component.id}:`, error);
      }
    });

    // Second pass: Build component tree by establishing parent-child relationships
    components.forEach(component => {
      const parentElement = this.componentElements.get(component.id);
      if (!parentElement) return;

      // Handle regular children array
      if (component.children && Array.isArray(component.children)) {
          component.children.forEach((childId: string) => {
            const childElement = this.componentElements.get(childId);
            if (childElement) {
              // Special handling for Button: children should be attached to button, not as siblings
              if (component.component === 'Button') {
                // Skip - Button children are handled separately after all components are created
              } else {
                parentElement.appendChild(childElement);
                console.log(`🔗 Connected ${childId} to parent ${component.id}`);
              }
            } else {
              console.warn(`⚠️ Child component not found: ${childId}`);
            }
          });
      }
    });

    // Fourth pass: Attach children to Button components (after all components are created and tree is built)
    components.forEach(component => {
      if (component.component === 'Button') {
        const buttonElement = this.componentElements.get(component.id);
        if (buttonElement) {
          attachButtonChildren(buttonElement, this.componentElements);
        }
      }

    });

    // Third pass: Add root component to surface
    const rootComponent = components.find(c => c.id === 'root');
    if (rootComponent) {
      const rootElement = this.componentElements.get('root');
      if (rootElement) {
        surface.appendChild(rootElement);
        this.rootComponents.set(surfaceId, 'root');
        console.log(`🌳 Added root component to surface: ${surfaceId}`);
      }
    } else {
      // If no root component, add all top-level components
      components.forEach(component => {
        const isChild = components.some(c => 
          c.children && Array.isArray(c.children) && c.children.includes(component.id)
        );
        if (!isChild) {
          const element = this.componentElements.get(component.id);
          if (element) {
            surface.appendChild(element);
            console.log(`🌱 Added top-level component: ${component.id}`);
          }
        }
      });
    }
    
    console.log(`✅ Updated ${components.length} components for surface: ${surfaceId}`);
  }

  /**
   * Handle updateDataModel message (v0.9 format with HLC timestamps)
   */
  handleUpdateDataModel(data: A2UIUpdateDataModelMessage['updateDataModel']): void {
    const { surfaceId, updates, versions } = data;
    
    let dataModel = this.dataModels.get(surfaceId);
    if (!dataModel) {
      dataModel = {};
      this.dataModels.set(surfaceId, dataModel);
    }

    // Apply updates in order
    updates.forEach(update => {
      try {
        this.applyDataUpdate(dataModel, update);
      } catch (error) {
        console.error(`❌ Failed to apply data update at ${update.path}:`, error);
      }
    });

    // Store version vector for conflict resolution
    this.storeVersionVector(surfaceId, versions);
    
    // Trigger re-render of affected components
    this.updateComponentsWithData(surfaceId);
    
    console.log(`✅ Updated data model for surface: ${surfaceId} (${updates.length} updates)`);
  }

  /**
   * Handle deleteSurface message
   */
  handleDeleteSurface(data: A2UIDeleteSurfaceMessage['deleteSurface']): void {
    const { surfaceId } = data;
    
    const surface = this.surfaces.get(surfaceId);
    if (surface) {
      surface.remove();
      this.surfaces.delete(surfaceId);
    }
    
    // Clean up associated data
    this.dataModels.delete(surfaceId);
    this.rootComponents.delete(surfaceId);
    
    // Clean up component elements
    this.componentElements.forEach((element, id) => {
      if (element && element.closest && element.closest(`[data-surface-id="${surfaceId}"]`)) {
        this.componentElements.delete(id);
      }
    });
    
    console.log(`✅ Deleted surface: ${surfaceId}`);
  }

  // Legacy method for backward compatibility
  handleBeginRendering(data: any): void {
    console.warn('⚠️ beginRendering is deprecated, use createSurface instead');
    this.handleCreateSurface({
      surfaceId: data.surfaceId,
      catalogId: 'legacy-catalog'
    });
  }

  // Legacy method for backward compatibility  
  handleSurfaceUpdate(data: any): void {
    console.warn('⚠️ surfaceUpdate is deprecated, use updateComponents instead');
    this.handleUpdateComponents({
      surfaceId: data.surfaceId,
      components: data.components
    });
  }

  private clearSurfaceComponents(surfaceId: string): void {
    const surface = this.surfaces.get(surfaceId);
    if (surface) {
      surface.innerHTML = '';
    }
    
    // Remove component elements for this surface
    this.componentElements.forEach((element, id) => {
      if (element && element.closest && element.closest(`[data-surface-id="${surfaceId}"]`)) {
        this.componentElements.delete(id);
      }
    });
  }

  private applyDataUpdate(dataModel: any, update: any): void {
    const { path, value, hlc, pos } = update;
    
    // Parse JSON Pointer path
    const pathParts = path.split('/').filter(Boolean);
    
    // Navigate to parent object
    let current = dataModel;
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }
    
    // Set value at final path
    const finalKey = pathParts[pathParts.length - 1];
    if (value === null) {
      // Tombstone deletion
      delete current[finalKey];
    } else {
      current[finalKey] = value;
    }
    
    // Store HLC timestamp for this update
    if (hlc) {
      current[`__hlc_${finalKey}`] = hlc;
    }
    
    // Store position for ordered lists
    if (pos) {
      current[`__pos_${finalKey}`] = pos;
    }
  }

  private storeVersionVector(surfaceId: string, versions: any): void {
    // Store version vector in data model metadata
    const dataModel = this.dataModels.get(surfaceId);
    if (dataModel) {
      dataModel.__versions = versions;
    }
  }

  private updateComponentsWithData(surfaceId: string): void {
    const surface = this.surfaces.get(surfaceId);
    if (!surface) {
      console.warn(`⚠️ Cannot update components with data, surface not found: ${surfaceId}`);
      return;
    }

    const dataModel = this.dataModels.get(surfaceId);
    if (!dataModel) {
      console.warn(`⚠️ No data model found for surface: ${surfaceId}`);
      return;
    }

    console.log(`🔄 Updating data-bound components for surface: ${surfaceId}`);

    // 更新绑定了文本路径的 Text 组件
    const textNodes = surface.querySelectorAll<HTMLElement>('[data-binding-text-path]');
    textNodes.forEach(node => {
      const path = node.dataset.bindingTextPath;
      if (!path) return;
      try {
        const value = this.propertyResolver.resolveValue({ path }, surfaceId);
        node.textContent = (value ?? '').toString();
      } catch (error) {
        console.error(`❌ Failed to update text binding for path ${path}:`, error);
      }
    });

    // 更新绑定了图片地址的 Image 组件
    const imageNodes = surface.querySelectorAll<HTMLImageElement>('[data-binding-url-path]');
    imageNodes.forEach(node => {
      const path = node.dataset.bindingUrlPath;
      if (!path) return;
      try {
        const value = this.propertyResolver.resolveValue({ path }, surfaceId);
        if (typeof value === 'string') {
          node.src = value;
        }
      } catch (error) {
        console.error(`❌ Failed to update image url binding for path ${path}:`, error);
      }
    });

    // 更新 Icon 组件的 name 绑定
    const iconNodes = surface.querySelectorAll<HTMLElement>('[data-binding-icon-name-path]');
    iconNodes.forEach(node => {
      const path = node.dataset.bindingIconNamePath;
      if (!path) return;
      try {
        const value = this.propertyResolver.resolveValue({ path }, surfaceId);
        if (typeof value === 'string') {
          // 移除旧的 icon-* 类
          node.classList.forEach(cls => {
            if (cls.startsWith('icon-')) {
              node.classList.remove(cls);
            }
          });
          node.classList.add(`icon-${value}`);
        }
      } catch (error) {
        console.error(`❌ Failed to update icon name binding for path ${path}:`, error);
      }
    });

    // 简单处理使用模板的 List（只根据当前 dataModel 展开，不改变样式）
    const listNodes = surface.querySelectorAll<HTMLElement>('[data-binding-list-path][data-template-component-id]');
    listNodes.forEach(listNode => {
      const listPath = listNode.dataset.bindingListPath;
      const templateId = listNode.dataset.templateComponentId;
      if (!listPath || !templateId) return;

      const templateElement = this.componentElements.get(templateId);
      if (!templateElement) {
        console.warn(`⚠️ Template component not found for List: ${templateId}`);
        return;
      }

      // 从数据模型中获取数组
      const items = this.propertyResolver.resolveValue({ path: listPath }, surfaceId);
      if (!Array.isArray(items)) {
        // 非数组时，不进行动态展开，保留原本结构
        return;
      }

      // 清空当前 List 内容，然后克隆模板多份
      listNode.innerHTML = '';
      items.forEach((item, index) => {
        const clone = templateElement.cloneNode(true) as HTMLElement;
        // 为调试用途标注索引，不影响视觉
        clone.setAttribute('data-template-index', index.toString());
        clone.setAttribute('data-list-item', JSON.stringify(item));
        
        // 更新克隆元素中的button action context，将item数据注入
        const buttons = clone.querySelectorAll<HTMLElement>('[data-component-id]');
        buttons.forEach(button => {
          // 检查是否是button组件
          if (button.classList.contains('a2ui-button')) {
            // 获取button的原始action（如果有存储的话）
            // 由于button的action是在创建时设置的，我们需要在点击时动态获取item数据
            // 这里我们存储item数据到button的dataset中，以便在action handler中使用
            button.dataset.listItemData = JSON.stringify(item);
            console.log(`📦 Injected item data into button at index ${index}:`, item);
          }
        });
        
        listNode.appendChild(clone);
      });
    });
  }
}