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
    if ('createSurface' in message) {
      this.messageHandlers.handleCreateSurface(message.createSurface);
    } else if ('updateComponents' in message) {
      this.messageHandlers.handleUpdateComponents(message.updateComponents);
    } else if ('updateDataModel' in message) {
      this.messageHandlers.handleUpdateDataModel(message.updateDataModel);
    } else if ('deleteSurface' in message) {
      this.messageHandlers.handleDeleteSurface(message.deleteSurface);
    } else {
      // Legacy v0.8 support
      if ('beginRendering' in message) {
        console.warn('⚠️ Using deprecated beginRendering, consider upgrading to createSurface');
        this.messageHandlers.handleBeginRendering((message as any).beginRendering);
      } else if ('surfaceUpdate' in message) {
        console.warn('⚠️ Using deprecated surfaceUpdate, consider upgrading to updateComponents');
        this.messageHandlers.handleSurfaceUpdate((message as any).surfaceUpdate);
      } else if ('dataModelUpdate' in message) {
        console.warn('⚠️ Using legacy dataModelUpdate format');
        // Convert legacy format to v0.9
        const legacyData = (message as any).dataModelUpdate;
        const v09Data = {
          surfaceId: legacyData.surfaceId,
          actorId: 'legacy-agent',
          updates: [{
            path: legacyData.path || '/',
            value: legacyData.contents,
            hlc: new Date().toISOString() + ':1:legacy-agent'
          }],
          versions: {
            'legacy-agent': new Date().toISOString() + ':1:legacy-agent'
          }
        };
        this.messageHandlers.handleUpdateDataModel(v09Data);
      }
    }
  }

  /**
   * Process multiple messages (typical A2UI response format)
   */
  processMessages(messages: A2UIMessage[]): void {
    messages.forEach(message => {
      try {
        this.processMessage(message);
      } catch (error) {
        console.error('❌ Failed to process A2UI message:', error, message);
      }
    });
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

  /**
   * Validate A2UI message format (basic validation)
   */
  static validateMessage(message: any): boolean {
    if (!message || typeof message !== 'object') {
      return false;
    }

    const validMessageTypes = ['createSurface', 'updateComponents', 'updateDataModel', 'deleteSurface'];
    const messageKeys = Object.keys(message);
    
    // Should have exactly one message type
    if (messageKeys.length !== 1) {
      return false;
    }

    const messageType = messageKeys[0];
    if (!validMessageTypes.includes(messageType)) {
      // Check for legacy formats
      const legacyTypes = ['beginRendering', 'surfaceUpdate', 'dataModelUpdate'];
      return legacyTypes.includes(messageType);
    }

    return true;
  }

  /**
   * Generate HLC timestamp for data updates
   */
  static generateHLC(actorId: string = 'client'): string {
    const timestamp = new Date().toISOString();
    const counter = Math.floor(Math.random() * 1000);
    return `${timestamp}:${counter}:${actorId}`;
  }
}