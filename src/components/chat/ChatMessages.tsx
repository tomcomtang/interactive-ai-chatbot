import React, { useEffect, useRef } from 'react';
import { A2UIRenderer } from '../../lib/a2ui-renderer';
import { allMockExamples } from '../../lib/a2ui-mock-data';
import type { UIMessage } from 'ai';

interface ChatMessagesProps {
  messages: UIMessage[];
  status: 'ready' | 'streaming' | 'submitted' | 'error';
  commandMap: Record<string, keyof typeof allMockExamples>;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, status, commandMap }) => {
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

  // 检查消息是否是A2UI命令
  const isA2UICommand = (message: UIMessage) => {
    if (message.role !== 'user') return false;
    const text = message.parts.find(part => part.type === 'text')?.text || '';
    return commandMap[text.toLowerCase()] !== undefined;
  };

  // 获取A2UI演示类型
  const getA2UIDemoType = (message: UIMessage): keyof typeof allMockExamples | null => {
    if (message.role !== 'user') return null;
    const text = message.parts.find(part => part.type === 'text')?.text || '';
    return commandMap[text.toLowerCase()] || null;
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
        
        {messages.map((message, index) => {
          const isLastMessage = index === messages.length - 1;
          const isStreaming = status === 'streaming' && isLastMessage && message.role === 'assistant';
          const demoType = getA2UIDemoType(message);
          
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
                {/* 如果是A2UI命令的下一条AI消息，显示A2UI演示 */}
                {message.role === 'assistant' && index > 0 && isA2UICommand(messages[index - 1]) && demoType ? (
                  <A2UIMessage demoType={getA2UIDemoType(messages[index - 1])!} />
                ) : (
                  <MessageContent message={message} isStreaming={isStreaming} />
                )}
                
                {/* 移除原来的流式指示器，现在在MessageContent内部处理 */}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

// 渲染消息内容（使用AI SDK的parts）
const MessageContent: React.FC<{ message: UIMessage; isStreaming: boolean }> = ({ message, isStreaming }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<A2UIRenderer | null>(null);
  
  // 获取所有文本内容
  const textContent = message.parts
    .filter(part => part.type === 'text')
    .map(part => part.text)
    .join('');

  useEffect(() => {
    if (contentRef.current && !rendererRef.current) {
      rendererRef.current = new A2UIRenderer(contentRef.current);
    }
  }, []);

  useEffect(() => {
    if (rendererRef.current && textContent && !isStreaming) {
      // 只有在不是流式状态时才渲染内容
      if (contentRef.current) {
        contentRef.current.innerHTML = '';
      }
      
      const textMessage = {
        type: 'createSurface' as const,
        surfaceId: `text-${message.id}`,
        components: [
          {
            type: 'Card',
            id: 'message-card',
            elevation: 1,
            children: [
              {
                type: 'Text',
                text: textContent,
                size: 'medium'
              }
            ]
          }
        ]
      };
      
      try {
        rendererRef.current.processMessage(textMessage);
      } catch (error) {
        console.error('Error rendering message:', error);
        // 降级到简单文本显示
        if (contentRef.current) {
          contentRef.current.innerHTML = `<div style="padding: 12px; background: rgba(255,255,255,0.1); border-radius: 8px; color: white;">${textContent}</div>`;
        }
      }
    } else if (!isStreaming && textContent) {
      // 如果A2UI渲染器不可用，直接显示文本
      if (contentRef.current) {
        contentRef.current.innerHTML = `<div style="padding: 12px; background: rgba(255,255,255,0.1); border-radius: 8px; color: white;">${textContent}</div>`;
      }
    }
  }, [textContent, message.id, isStreaming]);

  // 如果正在流式传输，显示加载动画
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

// 加载动画组件
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