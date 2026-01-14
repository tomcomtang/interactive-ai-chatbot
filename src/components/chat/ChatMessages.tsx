import React, { useEffect, useRef } from 'react';
import { A2UIRenderer } from '../../lib/a2ui-renderer';
import { allMockExamples } from '../../lib/a2ui-mock-data';

interface ChatMessagesProps {
  messages: Array<{
    id: string;
    text: string;
    sender: 'user' | 'ai';
    type?: 'text' | 'a2ui';
    demoType?: keyof typeof allMockExamples;
  }>;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 渲染消息内容
  const renderMessageContent = (message: ChatMessagesProps['messages'][0]) => {
    if (message.type === 'a2ui' && message.demoType) {
      return <A2UIMessage demoType={message.demoType} />;
    }
    
    return <TextMessage text={message.text} />;
  };

  return (
    <div ref={containerRef} className="chat-container">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="welcome-message">
            <h2>👋 Welcome to A2UI Chat</h2>
            <p>Hi! I'm your AI assistant. Ask me anything or try typing keywords like "profile", "products" to see UI components.</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.sender}-message`}>
            <div className="message-avatar">
              {message.sender === 'user' ? (
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
              {renderMessageContent(message)}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

// 文本消息组件
const TextMessage: React.FC<{ text: string }> = ({ text }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      const renderer = new A2UIRenderer(contentRef.current);
      const textMessage = {
        type: 'createSurface',
        surfaceId: `text-${Date.now()}`,
        components: [
          {
            type: 'Card',
            id: 'message-card',
            elevation: 1,
            children: [
              {
                type: 'Text',
                text: text,
                size: 'medium'
              }
            ]
          }
        ]
      };
      renderer.processMessage(textMessage);
    }
  }, [text]);

  return <div ref={contentRef} />;
};

// A2UI 演示消息组件
const A2UIMessage: React.FC<{ demoType: keyof typeof allMockExamples }> = ({ demoType }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      const renderer = new A2UIRenderer(contentRef.current);
      
      // 监听 action 事件
      const handleAction = (e: CustomEvent) => {
        console.log('A2UI Action:', e.detail);
        alert(`Action: ${e.detail.actionName}\nData: ${JSON.stringify(e.detail.dataModel, null, 2)}`);
      };
      
      contentRef.current.addEventListener('a2ui:action', handleAction as EventListener);
      
      // 处理所有消息
      const messages = allMockExamples[demoType];
      try {
        messages.forEach((msg: any) => {
          renderer.processMessage(msg);
        });
      } catch (error) {
        console.error('Error processing A2UI messages:', error);
      }
      
      // 清理事件监听器
      return () => {
        if (contentRef.current) {
          contentRef.current.removeEventListener('a2ui:action', handleAction as EventListener);
        }
      };
    }
  }, [demoType]);

  return <div ref={contentRef} />;
};

export default ChatMessages;