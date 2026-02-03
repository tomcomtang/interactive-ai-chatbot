import React, { useEffect, useRef, useCallback } from 'react';
import { A2UIRenderer } from '../../lib/a2ui-renderer';
import type { ChatMessage, ChatStatus } from './useCustomChat';

interface ChatMessagesProps {
  messages: ChatMessage[];
  status: ChatStatus;
  onSendMessage?: (message: { text: string; isAction?: boolean }) => Promise<void>;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, status, onSendMessage }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);


  // Auto scroll to bottom
  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  // Only auto scroll when:
  // 1. New messages are added (messages array length changes)
  // 2. Streaming finishes (status changes from 'streaming' to 'ready')
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]); // Only when new messages are added

  // Scroll when streaming finishes
  useEffect(() => {
    if (status === 'ready') {
      // Small delay to ensure content is rendered
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [status]);

  return (
    <div ref={containerRef} className="chat-container">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="welcome-message">
            <h2>👋 AI Interactive Chat UI</h2>
            <p>An AI conversational platform with interactive UI components. Enables structured bidirectional interactions through text and UI, dramatically improving efficiency.</p>
          </div>
        )}

        {messages.map((message, index) => {
          const isLastMessage = index === messages.length - 1;
          const isStreaming = status === 'streaming' && isLastMessage && message.role === 'assistant';

          return (
            <div key={message.id} className={`message ${message.role === 'user' ? 'user' : 'ai'}-message`}>
              <div className="message-avatar">
                {message.role === 'user' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="11" fill="rgba(255, 255, 255, 0.1)" stroke="currentColor" strokeWidth="1" />
                    <path d="M12 5c1.8 0 3.2 1.4 3.2 3.2S13.8 11.4 12 11.4s-3.2-1.4-3.2-3.2S10.2 5 12 5zm0 7.2c2.4 0 7.2 1.2 7.2 3.6v1.4c0 0.4-0.4 0.8-0.8 0.8H5.6c-0.4 0-0.8-0.4-0.8-0.8v-1.4c0-2.4 4.8-3.6 7.2-3.6z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="11" fill="rgba(255, 255, 255, 0.1)" stroke="currentColor" strokeWidth="1" />
                    <path d="M12 3.5l2.32 4.69L20 9.27l-4 3.9 0.94 5.48L12 16.23l-4.94 2.42L8 13.17 4 9.27l5.68-1.08L12 3.5z" />
                  </svg>
                )}
              </div>
              <div className="message-content a2ui-message-content" style={{
                flex: '1 1 auto',
                minWidth: 0,
                maxWidth: '100%',
                padding: 0,
                lineHeight: 1.5,
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                display: 'block',
                background: 'transparent',
                border: 'none'
              }}>
                <MessageContent
                  message={message}
                  isStreaming={isStreaming}
                  onSendMessage={onSendMessage}
                />
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

// Render message content
const MessageContent: React.FC<{
  message: ChatMessage;
  isStreaming: boolean;
  onSendMessage?: (message: { text: string; isAction?: boolean }) => Promise<void>;
}> = ({ message, isStreaming, onSendMessage }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<A2UIRenderer | null>(null);

  // Get all text content (compatible with parts and direct content)
  const textContent = message.parts
    ? message.parts
      .filter(part => part.type === 'text')
      .map(part => part.text)
      .join('')
    : message.content || '';

  // Check if content contains A2UI JSON messages (A2UI standard format)
  const isA2UIContent = (content: string): boolean => {
    // Look for JSON array pattern anywhere in the content
    const jsonArrayMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (jsonArrayMatch) {
      const jsonStr = jsonArrayMatch[0];
      try {
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Check if it contains A2UI message structure (v0.9 format)
          const hasA2UIStructure = parsed.some(msg =>
            msg.createSurface || msg.updateComponents || msg.updateDataModel ||
            msg.beginRendering || msg.surfaceUpdate || msg.dataModelUpdate  // backward compatibility
          );
          return hasA2UIStructure;
        }
      } catch (e) {
        // Not valid JSON, continue checking
      }
    }

    // Check for pure JSON format (A2UI standard)
    const trimmed = content.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Check if it contains A2UI message structure (v0.9 format)
          const hasA2UIStructure = parsed.some(msg =>
            msg.createSurface || msg.updateComponents || msg.updateDataModel ||
            msg.beginRendering || msg.surfaceUpdate || msg.dataModelUpdate  // backward compatibility
          );
          return hasA2UIStructure;
        }
      } catch (e) {
        // Not valid JSON, continue checking
      }
    }

    // Check for single JSON object that might be A2UI (but wrong format)
    // This handles cases where AI returns wrong format but still has A2UI keywords
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.createSurface || parsed.updateComponents || parsed.updateDataModel) {
          console.warn('⚠️ Detected A2UI-like structure but in wrong format (single object instead of array)');
          // Still return true so we can show error message
          return true;
        }
      } catch (e) {
        // Not valid JSON, ignore
      }
    }

    // Fallback: check for old format with delimiter (backward compatibility)
    if (content.includes('---a2ui_JSON---')) {
      return true;
    }

    return false;
  };

  // Parse A2UI messages from content (A2UI standard format)
  const parseA2UIResponse = (content: string) => {
    // Try to find and extract JSON array from the content
    const jsonArrayMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (jsonArrayMatch) {
      const jsonStr = jsonArrayMatch[0];
      try {
        const a2uiMessages = JSON.parse(jsonStr);

        // Extract any text before the JSON as textPart
        const beforeJson = content.substring(0, content.indexOf(jsonStr)).trim();
        const textPart = beforeJson.length > 0 ? beforeJson : '';

        return {
          textPart: textPart.length > 100 ? textPart.substring(0, 100) + '...' : textPart,
          a2uiMessages: Array.isArray(a2uiMessages) ? a2uiMessages : [],
          error: null
        };
      } catch (error) {
        console.error('❌ Failed to parse JSON array:', error);
        return { textPart: 'Failed to parse UI data', a2uiMessages: [], error: 'parse_error' };
      }
    }

    // Handle pure JSON format (A2UI standard)
    const trimmed = content.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      return parseJSONPart(trimmed, '');
    }

    // Handle single JSON object (wrong format, but might be A2UI-like)
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.createSurface || parsed.updateComponents || parsed.updateDataModel) {
          console.warn('⚠️ AI returned wrong format: single object instead of message array');
          return {
            textPart: '',
            a2uiMessages: [],
            error: 'wrong_format',
            originalContent: content
          };
        }
      } catch (e) {
        // Not valid JSON, fall through
      }
    }

    // Handle old format with delimiter (backward compatibility)
    if (content.includes('---a2ui_JSON---')) {
      const parts = content.split('---a2ui_JSON---');
      if (parts.length !== 2) {
        return { textPart: content, a2uiMessages: [], error: null };
      }

      let textPart = parts[0].trim();
      let jsonPart = parts[1].trim();

      // Clean up text part - remove any extra explanations
      const lines = textPart.split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        textPart = lines[0]; // Only keep the first line
      }

      // More aggressive JSON cleaning
      // Remove any text before the first [ and after the last ]
      const startIndex = jsonPart.indexOf('[');
      const endIndex = jsonPart.lastIndexOf(']');

      if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
        console.error('❌ No valid JSON array found');
        return { textPart: textPart || 'UI generated!', a2uiMessages: [], error: null };
      }

      jsonPart = jsonPart.substring(startIndex, endIndex + 1);
      return parseJSONPart(jsonPart, textPart);
    }

    // Fallback: not A2UI content
    return { textPart: content, a2uiMessages: [], error: null };
  };

  // Helper function to parse JSON part
  const parseJSONPart = (jsonPart: string, textPart: string = '') => {
    try {
      const a2uiMessages = JSON.parse(jsonPart);
      return {
        textPart: textPart.length > 100 ? textPart.substring(0, 100) + '...' : textPart,
        a2uiMessages: Array.isArray(a2uiMessages) ? a2uiMessages : [],
        error: null
      };
    } catch (error) {
      console.error('❌ Failed to parse A2UI JSON:', error);
      console.error('📄 Problematic JSON:', jsonPart);

      // Try to fix common JSON issues
      try {
        // Remove trailing commas and fix common issues
        let fixedJson = jsonPart
          .replace(/,\s*}/g, '}')  // Remove trailing commas in objects
          .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
          .replace(/'/g, '"')      // Replace single quotes with double quotes
          .replace(/(\w+):/g, '"$1":'); // Add quotes to unquoted keys

        const a2uiMessages = JSON.parse(fixedJson);
        return {
          textPart: textPart || 'UI generated!',
          a2uiMessages: Array.isArray(a2uiMessages) ? a2uiMessages : [],
          error: null
        };
      } catch (fixError) {
        console.error('❌ JSON fix attempt failed:', fixError);
        return { textPart: textPart || 'UI generated!', a2uiMessages: [], error: 'parse_error' };
      }
    }
  };

  // Handle button actions (A2UI v0.9 standard)
  // Client-side actions (functionCall) are handled in button.ts
  // Server-side actions (userAction/event) are sent to AI here
  const handleAction = useCallback((a2uiActionMessage: any) => {
    // A2UI v0.9 standard format: { userAction: { name, surfaceId, sourceComponentId, timestamp, context } }
    if (!a2uiActionMessage.userAction) {
      console.warn('⚠️ Invalid A2UI action message format - expected userAction');
      return;
    }

    // Send userAction to AI for processing
    if (!onSendMessage) {
      console.warn('⚠️ onSendMessage not available, action will be ignored');
      return;
    }

    console.log('📤 Sending userAction to AI (no user message in list, A2UI-style):', a2uiActionMessage);

    onSendMessage({ text: JSON.stringify(a2uiActionMessage), isAction: true }).catch(error => {
      console.error('❌ Failed to send action message:', error);
    });
  }, [onSendMessage]);

  useEffect(() => {
    if (contentRef.current && !rendererRef.current) {
      rendererRef.current = new A2UIRenderer(contentRef.current, handleAction);
    }
  }, [contentRef.current, handleAction]); // Depends on contentRef.current and handleAction changes

  useEffect(() => {
    // Ensure renderer is initialized
    if (contentRef.current && !rendererRef.current) {
      rendererRef.current = new A2UIRenderer(contentRef.current, handleAction);
    }

    if (rendererRef.current && textContent && !isStreaming) {
      // Clear previous content
      if (contentRef.current) {
        contentRef.current.innerHTML = '';
      }

      // Check if content contains A2UI JSON messages
      const isA2UI = isA2UIContent(textContent);

      if (isA2UI) {
        // Process A2UI standard format response
        const { textPart, a2uiMessages, error, originalContent } = parseA2UIResponse(textContent);

        // Handle wrong format error
        if (error === 'wrong_format') {
          console.error('❌ AI returned wrong A2UI format (single object instead of message array)');
          if (contentRef.current) {
            contentRef.current.innerHTML = `
              <div style="padding: 16px; background: rgba(255,165,0,0.15); border: 1px solid rgba(255,165,0,0.3); border-radius: 8px; color: white; margin-bottom: 12px;">
                <div style="font-weight: 600; margin-bottom: 8px; color: #ffa500;">⚠️ Format Error</div>
                <div style="font-size: 0.9em; margin-bottom: 12px; opacity: 0.9;">
                  AI returned A2UI-like content but in wrong format. Expected message array format, got single object.
                </div>
                <details style="margin-top: 12px;">
                  <summary style="cursor: pointer; font-size: 0.85em; opacity: 0.8;">Show raw response</summary>
                  <pre style="margin-top: 8px; padding: 12px; background: rgba(0,0,0,0.3); border-radius: 6px; overflow-x: auto; font-size: 0.75em; line-height: 1.4;">${JSON.stringify(originalContent ? JSON.parse(originalContent) : textContent, null, 2)}</pre>
                </details>
              </div>
            `;
          }
          return;
        }

        // First render the text part if it exists (but make it smaller since main content is UI)
        if (textPart && textPart.trim() && contentRef.current) {
          const textDiv = document.createElement('div');
          if (textDiv) {
            textDiv.style.cssText = 'padding: 8px 12px; background: rgba(255,255,255,0.05); border-radius: 6px; color: rgba(255,255,255,0.7); margin-bottom: 12px; font-size: 0.9em;';
            if (typeof textDiv.textContent !== 'undefined') {
              textDiv.textContent = textPart;
            } else {
              console.error('❌ textDiv.textContent is undefined');
            }
            contentRef.current.appendChild(textDiv);
          } else {
            console.error('❌ Failed to create textDiv element');
          }
        }

        // Then process A2UI messages using the standard format
        if (a2uiMessages.length > 0) {
          try {
            a2uiMessages.forEach((msg: any) => {
              rendererRef.current?.processMessage(msg);
            });
          } catch (error) {
            console.error('❌ Error processing A2UI messages:', error);
            // Fallback to text display
            if (contentRef.current) {
              contentRef.current.innerHTML = `<div style="padding: 12px; background: rgba(255,0,0,0.1); border-radius: 8px; color: white;">❌ Error rendering UI: ${error}</div>`;
            }
          }
        } else {
          console.warn('⚠️ No A2UI messages found in parsed content');
          if (contentRef.current) {
            contentRef.current.innerHTML = `<div style="padding: 12px; background: rgba(255,255,255,0.1); border-radius: 8px; color: white;">${textContent}</div>`;
          }
        }
      } else {
        // Regular text content - display as simple text
        if (contentRef.current) {
          contentRef.current.innerHTML = `<div style="padding: 12px; background: rgba(255,255,255,0.1); border-radius: 8px; color: white;">${textContent}</div>`;
        }
      }
    } else if (!isStreaming && textContent) {
      // If A2UI renderer is not available, display text directly
      if (contentRef.current) {
        contentRef.current.innerHTML = `<div style="padding: 12px; background: rgba(255,255,255,0.1); border-radius: 8px; color: white;">${textContent}</div>`;
      }
    }
  }, [textContent, message.id, isStreaming]);

  // Show loading animation if streaming
  if (isStreaming) {
    return (
      <div style={{
        padding: '12px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '8px',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <LoadingDots />
      </div>
    );
  }

  return <div ref={contentRef} />;
};

// Loading animation component
const LoadingDots: React.FC = () => {
  return (
    <div className="loading-dots" style={{
      display: 'flex',
      gap: '4px',
      alignItems: 'center'
    }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="loading-dot"
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            animation: `loadingDot 1.4s ease-in-out ${i * 0.16}s infinite both`
          }}
        />
      ))}
    </div>
  );
};

export default ChatMessages;