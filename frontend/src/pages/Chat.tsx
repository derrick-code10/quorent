import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useChat } from "../hooks/useChat";
import { TODAY } from "../lib/utils";
import DotGrid from "../components/DotGrid";
import MessageBubble from "../components/MessageBubble";
import ChatInput from "../components/ChatInput";
import ConversationList from "../components/ConversationList";

function GearIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function EmptyState({ onPrompt }: { onPrompt: (text: string) => void }) {
  const prompts = [
    "Summarise my articles from this week",
    "What are the key trends in my recent articles?",
    "Which topics appeared most frequently?",
    "Give me a quick briefing on today's news",
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="mb-6">
        <span className="w-2 h-2 rounded-full bg-accent inline-block mr-2" />
        <span className="font-mono text-[9px] uppercase tracking-widest text-accent font-bold">
          Quill · Your AI Correspondent
        </span>
      </div>
      <h2
        className="font-serif font-bold leading-tight mb-3"
        style={{
          fontSize: "clamp(1.4rem, 2.5vw, 1.8rem)",
          letterSpacing: "-0.02em",
        }}
      >
        Ask anything about your articles.
      </h2>
      <p className="font-sans text-sm text-text-muted leading-relaxed mb-8 max-w-sm">
        Quill draws from your personal article library to answer questions,
        surface trends, and synthesise your reading.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onPrompt(prompt)}
            className="text-left border-2 border-text-primary px-4 py-3 font-sans text-xs text-text-primary hover:bg-text-primary hover:text-background transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Chat() {
  const navigate = useNavigate();
  const {
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
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-screen flex flex-col bg-background text-text-primary font-sans antialiased overflow-hidden">
      <DotGrid />

      <header className="border-b-4 border-text-primary bg-background z-20 shrink-0">
        <div className="px-8 py-4 flex items-center">
          <div className="flex-1" />

          <div className="text-center">
            <h1
              className="font-serif font-bold uppercase leading-none"
              style={{
                fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
                letterSpacing: "-0.025em",
              }}
            >
              Quorent
            </h1>
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-accent mt-1">
              Ask Quill
            </p>
          </div>

          <div className="flex-1 flex items-center justify-end gap-4">
            <p className="font-mono text-[10px] text-text-muted hidden sm:block">
              {TODAY}
            </p>
            <button
              onClick={() => navigate("/settings")}
              aria-label="Settings"
              className="p-1.5 text-text-muted hover:text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
            >
              <GearIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="font-mono text-[10px] uppercase tracking-wider px-4 py-2 border-2 border-text-primary bg-background text-text-primary transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(36,36,34,1)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative z-10">
        <div className="w-64 shrink-0 hidden md:flex flex-col overflow-hidden">
          <ConversationList
            conversations={conversations}
            activeId={activeConversationId}
            loading={loadingConversations}
            onSelect={selectConversation}
            onNew={startNewConversation}
            onDelete={removeConversation}
          />
        </div>

        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            <div className="mx-auto w-full max-w-3xl space-y-5">
            {loadingMessages ? (
              <div className="flex justify-center items-center h-full">
                <span className="w-5 h-5 border-2 border-text-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <EmptyState onPrompt={sendMessage} />
            ) : (
              messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))
            )}
            <div ref={messagesEndRef} />
            </div>
          </div>

          {error && (
            <div className="mx-6 mb-2 border-l-4 border-red-400 bg-red-50 px-4 py-2 flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-widest text-red-700">
                {error}
              </p>
              <button
                onClick={clearError}
                className="font-mono text-[9px] uppercase tracking-widest text-red-500 hover:text-red-700 focus:outline-none"
              >
                ×
              </button>
            </div>
          )}

          <ChatInput
            onSend={sendMessage}
            disabled={loadingMessages}
            sending={sending}
          />
        </div>
      </div>
    </div>
  );
}
