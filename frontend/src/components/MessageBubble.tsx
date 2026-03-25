import type { LocalMessage } from "../hooks/useChat";
import { fmtTime } from "../lib/utils";

function SourceCard({ title, url }: { title: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border border-text-primary/20 px-3 py-2 hover:border-text-primary transition-colors group"
    >
      <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted mb-0.5">
        Source
      </p>
      <p className="font-sans text-xs text-text-primary group-hover:text-primary transition-colors line-clamp-1">
        {title}
      </p>
    </a>
  );
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1 px-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
        />
      ))}
    </span>
  );
}

interface MessageBubbleProps {
  message: LocalMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[72%]">
          <div className="bg-text-primary text-background px-4 py-3">
            <p className="font-sans text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          </div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted mt-1 text-right">
            {fmtTime(message.created_at)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[82%]">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
          <span className="font-mono text-[9px] uppercase tracking-widest text-accent font-bold">
            Quill
          </span>
        </div>
        <div className="border-2 border-text-primary bg-surface px-4 py-3">
          {message.pending ? (
            <ThinkingDots />
          ) : (
            <p className="font-sans text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          )}
        </div>

        {!message.pending && message.sources && message.sources.length > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {message.sources.map((src, i) => (
              <SourceCard key={i} title={src.title} url={src.url} />
            ))}
          </div>
        )}

        {!message.pending && (
          <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted mt-1">
            {fmtTime(message.created_at)}
          </p>
        )}
      </div>
    </div>
  );
}
