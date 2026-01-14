import React, { useEffect, useRef } from 'react';
import { A2UIRenderer } from '../../lib/a2ui-renderer';
import type { UIMessage } from 'ai';

interface ChatMessagesProps {
  messages: UIMessage[];
  status: 'ready' | 'streaming' | 'submitted' | 'error';
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, status }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debug logging
  console.log('🎭 ChatMessages render:', {
    messageCount: messages.length,
    status,
    lastMessage: messages[messages.length - 1]
  });

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
            <h2>👋 Welcome to A2UI Chat</h2>
            <p>Hi! I'm your AI assistant. Ask me anything or try typing keywords like "profile", "products" to see UI components.</p>
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
                    <circle cx="12" cy="12" r="11" fill="rgba(255, 255, 255, 0.1)" stroke="currentColor" strokeWidth="1"/>
                    <path d="M12 5c1.8 0 3.2 1.4 3.2 3.2S13.8 11.4 12 11.4s-3.2-1.4-3.2-3.2S10.2 5 12 5zm0 7.2c2.4 0 7.2 1.2 7.2 3.6v1.4c0 0.4-0.4 0.8-0.8 0.8H5.6c-0.4 0-0.8-0.4-0.8-0.8v-1.4c0-2.4 4.8-3.6 7.2-3.6z"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="11" fill="rgba(255, 255, 255, 0.1)" stroke="currentColor" strokeWidth="1"/>
                    <path d="M12 3.5l2.32 4.69L20 9.27l-4 3.9 0.94 5.48L12 16.23l-4.94 2.42L8 13.17 4 9.27l5.68-1.08L12 3.5z"/>
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

// Render message content (using AI SDK parts)
const MessageContent: React.FC<{ 
  message: UIMessage; 
  isStreaming: boolean;
}> = ({ message, isStreaming }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<A2UIRenderer | null>(null);
  
  // Get all text content
  const textContent = message.parts
    .filter(part => part.type === 'text')
    .map(part => part.text)
    .join('');

  // Check if content contains A2UI JSON messages (A2UI standard format)
  const isA2UIContent = (content: string): boolean => {
    console.log('🔍 Checking A2UI content (first 300 chars):', content.substring(0, 300));
    
    // Look for JSON array pattern anywhere in the content
    const jsonArrayMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (jsonArrayMatch) {
      const jsonStr = jsonArrayMatch[0];
      console.log('🔍 Found JSON array pattern');
      
      try {
        const parsed = JSON.parse(jsonStr);
        console.log('🔍 Parsed JSON successfully:', parsed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Check if it contains A2UI message structure (v0.9 format)
          const hasA2UIStructure = parsed.some(msg => 
            msg.createSurface || msg.updateComponents || msg.updateDataModel ||
            msg.beginRendering || msg.surfaceUpdate || msg.dataModelUpdate  // backward compatibility
          );
          console.log('✅ A2UI structure detected:', hasA2UIStructure);
          console.log('🔍 First message keys:', Object.keys(parsed[0] || {}));
          return hasA2UIStructure;
        }
      } catch (e) {
        console.log('❌ JSON parse failed:', e);
      }
    }
    
    // Check for pure JSON format (A2UI standard)
    const trimmed = content.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        console.log('🔍 Parsed pure JSON successfully:', parsed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Check if it contains A2UI message structure (v0.9 format)
          const hasA2UIStructure = parsed.some(msg => 
            msg.createSurface || msg.updateComponents || msg.updateDataModel ||
            msg.beginRendering || msg.surfaceUpdate || msg.dataModelUpdate  // backward compatibility
          );
          console.log('✅ A2UI structure detected:', hasA2UIStructure);
          console.log('🔍 First message keys:', Object.keys(parsed[0] || {}));
          return hasA2UIStructure;
        }
      } catch (e) {
        console.log('❌ Pure JSON parse failed:', e);
      }
    }
    
    // Fallback: check for old format with delimiter (backward compatibility)
    if (content.includes('---a2ui_JSON---')) {
      console.log('✅ Old A2UI format detected');
      return true;
    }
    
    console.log('❌ No A2UI content detected');
    return false;
  };

  // Parse A2UI messages from content (A2UI standard format)
  const parseA2UIResponse = (content: string) => {
    console.log('🔍 Parsing A2UI content (first 300 chars):', content.substring(0, 300));
    
    // Try to find and extract JSON array from the content
    const jsonArrayMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (jsonArrayMatch) {
      const jsonStr = jsonArrayMatch[0];
      console.log('🔧 Found JSON array, processing...');
      
      try {
        const a2uiMessages = JSON.parse(jsonStr);
        console.log('✅ Successfully parsed A2UI messages:', a2uiMessages);
        
        // Extract any text before the JSON as textPart
        const beforeJson = content.substring(0, content.indexOf(jsonStr)).trim();
        const textPart = beforeJson.length > 0 ? beforeJson : '';
        
        return { 
          textPart: textPart.length > 100 ? textPart.substring(0, 100) + '...' : textPart, 
          a2uiMessages: Array.isArray(a2uiMessages) ? a2uiMessages : [] 
        };
      } catch (error) {
        console.error('❌ Failed to parse JSON array:', error);
        return { textPart: 'Failed to parse UI data', a2uiMessages: [] };
      }
    }
    
    // Handle pure JSON format (A2UI standard)
    const trimmed = content.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      console.log('🔧 Processing pure JSON format');
      return parseJSONPart(trimmed, '');
    }
    
    // Handle old format with delimiter (backward compatibility)
    if (content.includes('---a2ui_JSON---')) {
      console.log('🔧 Processing legacy format with delimiter');
      const parts = content.split('---a2ui_JSON---');
      if (parts.length !== 2) {
        console.log('❌ Invalid delimiter count:', parts.length);
        return { textPart: content, a2uiMessages: [] };
      }
      
      let textPart = parts[0].trim();
      let jsonPart = parts[1].trim();
      
      console.log('📝 Text part:', textPart);
      console.log('🔧 Raw JSON part:', jsonPart);
      
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
        return { textPart: textPart || 'UI generated!', a2uiMessages: [] };
      }
      
      jsonPart = jsonPart.substring(startIndex, endIndex + 1);
      console.log('🧹 Cleaned JSON part:', jsonPart);
      
      return parseJSONPart(jsonPart, textPart);
    }
    
    // Fallback: not A2UI content
    console.log('❌ Content is not A2UI format');
    return { textPart: content, a2uiMessages: [] };
  };

  // Helper function to parse JSON part
  const parseJSONPart = (jsonPart: string, textPart: string = '') => {
    try {
      const a2uiMessages = JSON.parse(jsonPart);
      console.log('✅ Successfully parsed A2UI messages:', a2uiMessages);
      return { 
        textPart: textPart.length > 100 ? textPart.substring(0, 100) + '...' : textPart, 
        a2uiMessages: Array.isArray(a2uiMessages) ? a2uiMessages : [] 
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
        
        console.log('🔧 Attempting to fix JSON:', fixedJson);
        const a2uiMessages = JSON.parse(fixedJson);
        console.log('✅ Successfully parsed fixed JSON');
        return { 
          textPart: textPart || 'UI generated!', 
          a2uiMessages: Array.isArray(a2uiMessages) ? a2uiMessages : [] 
        };
      } catch (fixError) {
        console.error('❌ JSON fix attempt failed:', fixError);
        return { textPart: textPart || 'UI generated!', a2uiMessages: [] };
      }
    }
  };

  useEffect(() => {
    if (contentRef.current && !rendererRef.current) {
      console.log('🏗️ Initializing A2UI renderer...');
      rendererRef.current = new A2UIRenderer(contentRef.current);
      console.log('✅ A2UI renderer initialized successfully');
    }
  }, [contentRef.current]); // 依赖于contentRef.current的变化

  useEffect(() => {
    console.log('📊 MessageContent useEffect triggered:', {
      hasRenderer: !!rendererRef.current,
      hasTextContent: !!textContent,
      textContentLength: textContent?.length,
      isStreaming,
      messageId: message.id
    });

    // 确保渲染器已初始化
    if (contentRef.current && !rendererRef.current) {
      console.log('🏗️ Late initializing A2UI renderer...');
      rendererRef.current = new A2UIRenderer(contentRef.current);
      console.log('✅ A2UI renderer late initialized successfully');
    }

    if (rendererRef.current && textContent && !isStreaming) {
      console.log('🎯 MessageContent processing:', {
        hasRenderer: !!rendererRef.current,
        textContent: textContent.substring(0, 200) + '...',
        isStreaming
      });
      
      // Clear previous content
      if (contentRef.current) {
        contentRef.current.innerHTML = '';
      }

      // Check if content contains A2UI JSON messages
      const isA2UI = isA2UIContent(textContent);
      console.log('🎯 A2UI detection result:', isA2UI);
      
      if (isA2UI) {
        console.log('🎯 A2UI content detected! Processing...');
        // Process A2UI standard format response
        const { textPart, a2uiMessages } = parseA2UIResponse(textContent);
        
        console.log('🎯 A2UI processing result:', {
          textPart,
          messageCount: a2uiMessages.length,
          messages: a2uiMessages
        });
        
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
            console.log(`🚀 Processing ${a2uiMessages.length} A2UI messages...`);
            a2uiMessages.forEach((msg: any, index: number) => {
              console.log(`🔄 Processing A2UI message ${index + 1}:`, msg);
              rendererRef.current?.processMessage(msg);
            });
            console.log('✅ All A2UI messages processed successfully');
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
        console.log('📝 Displaying regular text content');
        if (contentRef.current) {
          contentRef.current.innerHTML = `<div style="padding: 12px; background: rgba(255,255,255,0.1); border-radius: 8px; color: white;">${textContent}</div>`;
        }
      }
    } else if (!isStreaming && textContent) {
      // If A2UI renderer is not available, display text directly
      console.log('⚠️ A2UI renderer not available, displaying text directly');
      if (contentRef.current) {
        contentRef.current.innerHTML = `<div style="padding: 12px; background: rgba(255,255,255,0.1); border-radius: 8px; color: white;">${textContent}</div>`;
      }
    } else {
      console.log('⏳ Waiting for content or still streaming...');
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