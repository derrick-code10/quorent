import { useState, useRef, useEffect } from "react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
  sending: boolean;
}

export default function ChatInput({ onSend, disabled, sending }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!sending && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [sending]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled || sending) return;
    onSend(trimmed);
    setValue("");
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  return (
    <div className="border-t-2 border-text-primary bg-background p-4">
      <div className="flex gap-3 items-end">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ask Quill about your articles…"
          disabled={disabled || sending}
          className="flex-1 resize-none font-sans text-sm bg-surface border-2 border-text-primary px-4 py-3 text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 overflow-hidden leading-relaxed"
          style={{ minHeight: "48px" }}
        />
        <button
          onClick={submit}
          disabled={!value.trim() || disabled || sending}
          aria-label="Send message"
          className="shrink-0 flex items-center justify-center w-12 h-12 bg-text-primary text-background border-2 border-text-primary transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(129,103,41,1)] disabled:opacity-30 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          {sending ? (
            <span className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
              aria-hidden="true"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>
      <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted mt-2">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
