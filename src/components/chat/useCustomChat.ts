/**
 * Custom Chat Hook - Replaces useChat, adapts to direct API call format.
 * Option 2 context: send last 2 rounds (user+assistant pairs) + current user message.
 * Assistant A2UI JSON is replaced with a short placeholder to keep request size small.
 */

import { useState, useCallback, useRef } from 'react';

const A2UI_PLACEHOLDER = '[A2UI UI was displayed]';
const LAST_N_ROUNDS = 2; // 2 rounds = 4 messages max from history

function isA2UIJSON(content: string): boolean {
  if (!content || typeof content !== 'string') return false;
  const trimmed = content.trim();
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) return false;
  try {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed) || parsed.length === 0) return false;
    return parsed.some((msg: { createSurface?: unknown; updateComponents?: unknown }) =>
      msg.createSurface != null || msg.updateComponents != null
    );
  } catch {
    return false;
  }
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  parts?: Array<{ type: 'text'; text: string }>;
}

export type ChatStatus = 'ready' | 'streaming' | 'submitted' | 'error';

/** Same as A2UI: actions (e.g. Details click) are sent as userAction only, not shown as a user message in the list. */
export interface SendMessageParams {
  text: string;
  /** When true, do not add a user message; send body.userAction instead. Used for button actions. */
  isAction?: boolean;
}

export interface UseCustomChatReturn {
  messages: ChatMessage[];
  status: ChatStatus;
  sendMessage: (message: SendMessageParams) => Promise<void>;
  isLoading: boolean;
}

export function useCustomChat(): UseCustomChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>('ready');
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (message: SendMessageParams) => {
    if (!message.text.trim()) return;

    const isAction = message.isAction === true;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message.text,
      parts: [{ type: 'text', text: message.text }]
    };

    // A2UI-style: do not add user message for button actions (no raw JSON in the list)
    if (!isAction) {
      setMessages(prev => [...prev, userMessage]);
    }

    setStatus('submitted');

    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      parts: []
    };

    setMessages(prev => [...prev, assistantMessage]);
    setStatus('streaming');

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // userAction: send only userAction (no history). Text: send last 2 rounds + current user (A2UI responses as placeholder).
      const requestData: Record<string, unknown> = isAction
        ? (() => {
            const parsed = JSON.parse(message.text) as { userAction?: Record<string, unknown> };
            return { userAction: parsed?.userAction ?? parsed };
          })()
        : (() => {
            const maxHistory = LAST_N_ROUNDS * 2; // 4 messages = 2 rounds
            const recent = messages.slice(-maxHistory);
            const mapped = recent.map((m) => {
              const content = m.content ?? (m.parts?.[0] as { text?: string } | undefined)?.text ?? '';
              const parts =
                m.role === 'assistant' && isA2UIJSON(content)
                  ? [{ type: 'text' as const, text: A2UI_PLACEHOLDER }]
                  : (m.parts ?? [{ type: 'text' as const, text: content }]).map((p) =>
                      typeof p === 'object' && p && 'text' in p
                        ? { type: 'text' as const, text: (p as { text: string }).text }
                        : { type: 'text' as const, text: content }
                    );
              return { id: m.id, role: m.role, parts };
            });
            const currentParts = [{ type: 'text' as const, text: message.text }];
            return { messages: [...mapped, { id: userMessage.id, role: 'user' as const, parts: currentParts }] };
          })();

      console.log('📥 前端提交给接口的JSON数据:');
      console.log(JSON.stringify(requestData, null, 2));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        signal: abortController.signal
      });

      if (!response.ok) {
        // Try to read error message from response body
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          if (errorData.details?.suggestion) {
            errorMessage += `\n\n${errorData.details.suggestion}`;
          }
        } catch (e) {
          // If response is not JSON, try to read as text
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = errorText;
            }
          } catch (textError) {
            // Keep default error message
          }
        }
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        throw error;
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          // Parse AI SDK format streaming data
          // Format: "0:{"type":"text-delta","textDelta":"..."}" or "0:{"type":"text","text":"..."}"
          const colonIndex = line.indexOf(':');
          if (colonIndex === -1) continue;

          try {
            const data = JSON.parse(line.slice(colonIndex + 1));
            
            if (data.type === 'text-delta' && data.textDelta) {
              accumulatedText += data.textDelta;
              // Update message content
              setMessages(prev => prev.map(msg => 
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      content: accumulatedText,
                      parts: [{ type: 'text', text: accumulatedText }]
                    }
                  : msg
              ));
            } else if (data.type === 'text') {
              // Complete text (usually UI JSON) - replaces all previous incremental content
              // Even if text is empty, it indicates stream has ended
              if (data.text) {
                accumulatedText = data.text;
                // 打印AI返回给前端的JSON数据
                console.log('📤 AI返回给前端的JSON数据:');
                console.log(accumulatedText);
              }
              setMessages(prev => prev.map(msg => 
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      content: accumulatedText,
                      parts: [{ type: 'text', text: accumulatedText }]
                    }
                  : msg
              ));
            }
          } catch (e) {
            // Ignore parsing errors
            console.warn('⚠️ Failed to parse stream chunk:', e, 'Line:', line.substring(0, 100));
          }
        }
      }

      // Ensure status is updated to ready
      setStatus('ready');
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setStatus('ready'); // Reset to ready state after abort
        return;
      }
      console.error('❌ Chat error:', error);
      
      // Update error message
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId
          ? {
              ...msg,
              content: `Error: ${error.message || 'Failed to get response'}`,
              parts: [{ type: 'text', text: `Error: ${error.message || 'Failed to get response'}` }]
            }
          : msg
      ));
      
      // Reset status to 'ready' after error so user can continue typing
      setStatus('ready');
    } finally {
      abortControllerRef.current = null;
    }
  }, [messages]);

  return {
    messages: messages.map(msg => ({
      ...msg,
      // Ensure compatibility with UIMessage format
      parts: msg.parts || [{ type: 'text', text: msg.content }]
    })) as any,
    status,
    sendMessage,
    isLoading: status === 'streaming' || status === 'submitted'
  };
}
