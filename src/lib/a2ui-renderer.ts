/**
 * A2UI Renderer - A2UI v0.9 Standard Protocol Implementation
 * Main renderer class that orchestrates all A2UI functionality
 */

import type { A2UIMessage } from './a2ui/types';
import { PropertyResolver } from './a2ui/property-resolver';
import { ComponentFactory } from './a2ui/component-factory';
import { MessageHandlers } from './a2ui/message-handlers';

export class A2UIRenderer {
  private container: HTMLElement;
  private surfaces: Map<string, HTMLElement> = new Map();
  private dataModels: Map<string, any> = new Map();
  private componentElements: Map<string, HTMLElement> = new Map();
  private rootComponents: Map<string, string> = new Map();
  
  private propertyResolver: PropertyResolver;
  private componentFactory: ComponentFactory;
  private messageHandlers: MessageHandlers;

  constructor(container: HTMLElement) {
    this.container = container;
    
    // Initialize sub-modules
    this.propertyResolver = new PropertyResolver(this.dataModels);
    this.componentFactory = new ComponentFactory(this.propertyResolver, this.componentElements);
    this.messageHandlers = new MessageHandlers(
      this.container,
      this.surfaces,
      this.dataModels,
      this.componentElements,
      this.rootComponents,
      this.componentFactory
    );
  }

  /**
   * Process A2UI v0.9 standard messages
   */
  processMessage(message: A2UIMessage): void {
    if ('beginRendering' in message) {
      this.messageHandlers.handleBeginRendering(message.beginRendering);
    } else if ('surfaceUpdate' in message) {
      this.messageHandlers.handleSurfaceUpdate(message.surfaceUpdate);
    } else if ('dataModelUpdate' in message) {
      this.messageHandlers.handleDataModelUpdate(message.dataModelUpdate);
    } else if ('deleteSurface' in message) {
      this.messageHandlers.handleDeleteSurface(message.deleteSurface);
    }
  }

  /**
   * Clear all content
   */
  clear(): void {
    this.container.innerHTML = '';
    this.surfaces.clear();
    this.dataModels.clear();
    this.componentElements.clear();
    this.rootComponents.clear();
  }

  /**
   * Get current surfaces (for debugging)
   */
  getSurfaces(): Map<string, HTMLElement> {
    return this.surfaces;
  }

  /**
   * Get current data models (for debugging)
   */
  getDataModels(): Map<string, any> {
    return this.dataModels;
  }
}