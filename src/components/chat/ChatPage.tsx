import React, { useState, useCallback } from 'react';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { allMockExamples } from '../../lib/a2ui-mock-data';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  type?: 'text' | 'a2ui';
  demoType?: keyof typeof allMockExamples;
}

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // 命令映射
  const commandMap: Record<string, keyof typeof allMockExamples> = {
    '1': 'userProfile',
    '用户资料': 'userProfile',
    'user profile': 'userProfile',
    '个人资料': 'userProfile',
    
    '2': 'contactForm',
    '联系表单': 'contactForm',
    'contact form': 'contactForm',
    '表单': 'contactForm',
    
    '3': 'productList',
    '产品列表': 'productList',
    'product list': 'productList',
    '商品列表': 'productList',
    
    '4': 'settingsPanel',
    '设置面板': 'settingsPanel',
    'settings panel': 'settingsPanel',
    '设置': 'settingsPanel',

    '5': 'table',
    '数据表格': 'table',
    'table': 'table',
    '表格': 'table',

    '6': 'dataVisualization',
    '数据展示': 'dataVisualization',
    'data visualization': 'dataVisualization',
    '图表': 'dataVisualization',
    'chart': 'dataVisualization',

    '7': 'media',
    '媒体组件': 'media',
    'media': 'media',
    '视频': 'media',
    'video': 'media',

    '8': 'advanced',
    '高级组件': 'advanced',
    'advanced': 'advanced',
    '日历': 'advanced',
    'calendar': 'advanced'
  };

  // 处理发送消息
  const handleSendMessage = useCallback(async (messageText: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    // 添加用户消息
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: messageText,
      sender: 'user',
      type: 'text'
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // 检查是否是 A2UI 命令
    const demoType = commandMap[messageText.toLowerCase()];
    
    // 模拟处理延迟
    setTimeout(() => {
      if (demoType) {
        // 添加 A2UI 演示消息
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          text: `Showing ${demoType} demo`,
          sender: 'ai',
          type: 'a2ui',
          demoType
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        // 添加普通 AI 回复
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          text: 'This is a placeholder response. AI integration coming soon!',
          sender: 'ai',
          type: 'text'
        };
        setMessages(prev => [...prev, aiMessage]);
      }
      
      setIsProcessing(false);
    }, 1000);
  }, [isProcessing, commandMap]);

  return (
    <main className="chat-section">
      {/* 固定的卡片背景 - 独立层 */}
      <div className="chat-background"></div>
      
      {/* 聊天内容区域 - 独立层 */}
      <ChatMessages messages={messages} />
      
      {/* 固定的输入框 - 独立层 */}
      <ChatInput 
        onSendMessage={handleSendMessage}
        disabled={isProcessing}
      />
    </main>
  );
};

export default ChatPage;