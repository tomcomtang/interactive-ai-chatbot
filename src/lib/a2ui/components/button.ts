/**
 * Button Component Creator
 */

import { PropertyResolver } from '../property-resolver';

export function createButtonElement(
  id: string,
  properties: any,
  componentElements: Map<string, HTMLElement>,
  handleAction: (action: any) => void,
  propertyResolver?: PropertyResolver,
  surfaceId?: string
): HTMLElement {
  const element = document.createElement('button');
  element.className = 'a2ui-button';
  element.setAttribute('data-component-id', id);

  if (properties.primary) {
    element.classList.add('button-primary');
  }

  // Store children IDs for later attachment (children may not exist yet when button is created)
  // Support both 'children' array and 'child' single ID for backward compatibility
  const childrenIds: string[] = [];
  if (properties.children && Array.isArray(properties.children)) {
    childrenIds.push(...properties.children);
  } else if (properties.child) {
    childrenIds.push(properties.child);
  }
  
  // Store children IDs in dataset for later processing
  if (childrenIds.length > 0) {
    element.dataset.buttonChildren = JSON.stringify(childrenIds);
  }

  // Try to attach children immediately if they exist
  childrenIds.forEach((childId: string) => {
    const childElement = componentElements.get(childId);
    if (childElement) {
      element.appendChild(childElement);
    }
  });

  // Handle action (A2UI v0.9 standard)
  if (properties.action) {
    element.addEventListener('click', () => {
      const action = properties.action;
      
      // A2UI v0.9: Check for functionCall (client-side action)
      if (action.functionCall) {
        const { call, args } = action.functionCall;
        console.log('🔧 Client-side functionCall:', call, args);
        
        // Handle openUrl function - opens URL in new tab
        if (call === 'openUrl' && args?.url) {
          console.log('🔗 Opening URL:', args.url);
          window.open(args.url, '_blank');
          return;
        }
        
        console.warn('⚠️ Unknown functionCall:', call);
        return;
      }
      
      // A2UI v0.9: Check for event (server-side action)
      if (action.event) {
        const surfaceElement = element.closest('[data-surface-id]');
        let resolvedSurfaceId = surfaceId || surfaceElement?.getAttribute('data-surface-id') || 'main';
        if (resolvedSurfaceId === 'undefined' || resolvedSurfaceId == null) resolvedSurfaceId = 'main';
        const sourceComponentId = id;
        const timestamp = new Date().toISOString();
        
        // Merge item data from List binding into event context if available
        const listItemDataStr = element.dataset.listItemData;
        let eventContext = { ...(action.event.context || {}) };
        
        if (listItemDataStr) {
          try {
            const listItemData = JSON.parse(listItemDataStr);
            console.log('📦 Found List item data for button:', listItemData);
            eventContext = { ...listItemData, ...eventContext };
          } catch (error) {
            console.error('❌ Failed to parse list item data:', error);
          }
        }
        
        // Resolve context - convert path references to actual values
        const resolvedContext: any = {};
        for (const [key, value] of Object.entries(eventContext)) {
          if (value && typeof value === 'object' && !Array.isArray(value) && 'path' in value && propertyResolver && resolvedSurfaceId) {
            resolvedContext[key] = propertyResolver.resolveValue(value, resolvedSurfaceId);
            console.log(`🔗 Resolved context[${key}] from path ${(value as any).path}:`, resolvedContext[key]);
          } else {
            resolvedContext[key] = value;
          }
        }
        
        // Create A2UI v0.9 standard userAction message
        const a2uiActionMessage = {
          userAction: {
            name: action.event.name,
            surfaceId: resolvedSurfaceId,
            sourceComponentId: sourceComponentId,
            timestamp: timestamp,
            context: resolvedContext
          }
        };
        
        console.log('📤 A2UI v0.9 userAction message:', JSON.stringify(a2uiActionMessage, null, 2));
        handleAction(a2uiActionMessage);
        return;
      }
      
      // Legacy format support: action.name (old format, for backward compatibility)
      if (action.name) {
        console.warn('⚠️ Using legacy action format. Please migrate to action.event or action.functionCall');
        
        // Check if it looks like an openUrl action
        if ((action.name === 'navigate' || action.name === 'openUrl') && action.context?.url) {
          console.log('🔗 Legacy navigate - Opening URL:', action.context.url);
          window.open(action.context.url, '_blank');
          return;
        }
        
        // Otherwise, treat as server event
        const surfaceElement = element.closest('[data-surface-id]');
        let resolvedSurfaceId = surfaceId || surfaceElement?.getAttribute('data-surface-id') || 'main';
        if (resolvedSurfaceId === 'undefined' || resolvedSurfaceId == null) resolvedSurfaceId = 'main';

        const a2uiActionMessage = {
          userAction: {
            name: action.name,
            surfaceId: resolvedSurfaceId,
            sourceComponentId: id,
            timestamp: new Date().toISOString(),
            context: action.context || {}
          }
        };
        
        console.log('📤 Legacy action converted to userAction:', JSON.stringify(a2uiActionMessage, null, 2));
        handleAction(a2uiActionMessage);
      }
    });
  }

  return element;
}

/**
 * Attach children to button after all components are created
 * This is called from message-handlers after the component tree is built
 */
export function attachButtonChildren(
  buttonElement: HTMLElement,
  componentElements: Map<string, HTMLElement>
): void {
  const childrenIdsStr = buttonElement.dataset.buttonChildren;
  if (!childrenIdsStr) return;

  try {
    const childrenIds: string[] = JSON.parse(childrenIdsStr);
    childrenIds.forEach((childId: string) => {
      const childElement = componentElements.get(childId);
      if (childElement && !buttonElement.contains(childElement)) {
        // Only append if not already attached
        buttonElement.appendChild(childElement);
        console.log(`🔗 Attached ${childId} to button ${buttonElement.getAttribute('data-component-id')}`);
      }
    });
  } catch (error) {
    console.error('Failed to parse button children IDs:', error);
  }
}
