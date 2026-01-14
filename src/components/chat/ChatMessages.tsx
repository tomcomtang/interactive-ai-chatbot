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
    console.log('🔍 Checking A2UI content:', content);
    
    // Check for pure JSON format (A2UI standard)
    const trimmed = content.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Check if it contains A2UI message structure
          const hasA2UIStructure = parsed.some(msg => 
            msg.beginRendering || msg.surfaceUpdate || msg.dataModelUpdate
          );
          console.log('✅ A2UI structure detected:', hasA2UIStructure);
          return hasA2UIStructure;
        }
      } catch (e) {
        console.log('❌ JSON parse failed:', e);
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
    console.log('🔍 Parsing A2UI content:', content);
    
    // Handle pure JSON format (A2UI standard)
    const trimmed = content.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      console.log('🔧 Processing A2UI standard JSON format');
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
      rendererRef.current = new A2UIRenderer(contentRef.current);
    }
  }, []);

  useEffect(() => {
    console.log('📊 MessageContent useEffect triggered:', {
      hasRenderer: !!rendererRef.current,
      hasTextContent: !!textContent,
      textContentLength: textContent?.length,
      isStreaming,
      messageId: message.id
    });

    if (rendererRef.current && textContent && !isStreaming) {
      // Clear previous content
      if (contentRef.current) {
        contentRef.current.innerHTML = '';
      }

      // Check if content contains A2UI JSON messages
      if (isA2UIContent(textContent)) {
        // Process A2UI standard format response
        const { textPart, a2uiMessages } = parseA2UIResponse(textContent);
        
        console.log('🎯 A2UI processing result:', {
          textPart,
          messageCount: a2uiMessages.length,
          messages: a2uiMessages
        });
        
        // First render the text part if it exists
        if (textPart && contentRef.current) {
          // Create a simple text display for the conversational part
          const textDiv = document.createElement('div');
          textDiv.style.cssText = 'padding: 12px; background: rgba(255,255,255,0.1); border-radius: 8px; color: white; margin-bottom: 16px;';
          textDiv.textContent = textPart;
          contentRef.current.appendChild(textDiv);
        }
        
        // Then process A2UI messages using the standard format
        try {
          a2uiMessages.forEach((msg: any, index: number) => {
            console.log(`🔄 Processing A2UI message ${index + 1}:`, msg);
            rendererRef.current?.processMessage(msg);
          });
          console.log('✅ All A2UI messages processed successfully');
        } catch (error) {
          console.error('❌ Error processing A2UI messages:', error);
          // Fallback to text display
          if (contentRef.current) {
            contentRef.current.innerHTML = `<div style="padding: 12px; background: rgba(255,255,255,0.1); border-radius: 8px; color: white;">${textPart || textContent}</div>`;
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