import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import {
  sendChat,
  getConversations,
  getConversation,
  deleteConversation as apiDeleteConversation,
} from "../lib/api";
import type { ConversationListItem, Message } from "../types/api";

export interface LocalMessage extends Omit<Message, "conversation_id" | "article_id"> {
  pending?: boolean;
}

interface ChatState {
  token: string | null;
  conversations: ConversationListItem[];
  activeConversationId: string | null;
  messages: LocalMessage[];
  sending: boolean;
  loadingConversations: boolean;
  loadingMessages: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  startNewConversation: () => void;
  removeConversation: (id: string) => Promise<void>;
  clearError: () => void;
}

export function useChat(): ChatState {
  const [token, setToken] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setToken(data.session.access_token);
    });
  }, []);

  useEffect(() => {
    if (!token) return;
    getConversations(token, { limit: 50 })
      .then(({ conversations }) => setConversations(conversations))
      .catch(() => {})
      .finally(() => setLoadingConversations(false));
  }, [token]);

  const selectConversation = useCallback(
    async (id: string) => {
      if (!token || id === activeConversationId) return;
      setLoadingMessages(true);
      setError(null);
      try {
        const conv = await getConversation(token, id);
        setActiveConversationId(id);
        setMessages(
          conv.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            sources: m.sources,
            created_at: m.created_at,
          })),
        );
      } catch {
        setError("Failed to load conversation.");
      } finally {
        setLoadingMessages(false);
      }
    },
    [token, activeConversationId],
  );

  const startNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setError(null);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!token || !text.trim() || sending) return;
      setError(null);

      const userMsg: LocalMessage = {
        id: `tmp-user-${Date.now()}`,
        role: "user",
        content: text.trim(),
        sources: null,
        created_at: new Date().toISOString(),
      };
      const pendingMsg: LocalMessage = {
        id: `tmp-assistant-${Date.now()}`,
        role: "assistant",
        content: "",
        sources: null,
        created_at: new Date().toISOString(),
        pending: true,
      };

      setMessages((prev) => [...prev, userMsg, pendingMsg]);
      setSending(true);

      try {
        const result = await sendChat(token, {
          message: text.trim(),
          conversation_id: activeConversationId ?? undefined,
        });

        const assistantMsg: LocalMessage = {
          id: `res-${Date.now()}`,
          role: "assistant",
          content: result.answer,
          sources: result.sources.length > 0 ? result.sources : null,
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev.filter((m) => !m.pending), assistantMsg]);

        if (result.conversation_id !== activeConversationId) {
          setActiveConversationId(result.conversation_id);
          getConversations(token, { limit: 50 })
            .then(({ conversations }) => setConversations(conversations))
            .catch(() => {});
        }
      } catch (err) {
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id && m.id !== pendingMsg.id));
        setError(err instanceof Error ? err.message : "Failed to send message.");
      } finally {
        setSending(false);
      }
    },
    [token, activeConversationId, sending],
  );

  const removeConversation = useCallback(
    async (id: string) => {
      if (!token) return;
      try {
        await apiDeleteConversation(token, id);
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeConversationId === id) {
          setActiveConversationId(null);
          setMessages([]);
        }
      } catch {
        setError("Failed to delete conversation.");
      }
    },
    [token, activeConversationId],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    token,
    conversations,
    activeConversationId,
    messages,
    sending,
    loadingConversations,
    loadingMessages,
    error,
    sendMessage,
    selectConversation,
    startNewConversation,
    removeConversation,
    clearError,
  };
}
