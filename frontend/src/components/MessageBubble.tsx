import type { LocalMessage } from "../hooks/useChat";
import { fmtTime } from "../lib/utils";

function SourceCard({ title, url }: { title: string; url: string }) {
  const baseClass =
    "block rounded-md border border-text-primary/20 bg-background px-3 py-2 transition-colors";

  if (!url) {
    return (
      <div className={baseClass}>
        <p className="font-sans text-xs text-text-primary line-clamp-1">{title}</p>
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${baseClass} hover:border-text-primary group`}
    >
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

type RenderBlock =
  | { type: "paragraph"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

function buildRenderBlocks(content: string): RenderBlock[] {
  const blocks: RenderBlock[] = [];
  const paragraphLines: string[] = [];
  const listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;
    blocks.push({ type: "paragraph", text: paragraphLines.join(" ") });
    paragraphLines.length = 0;
  };

  const flushList = () => {
    if (!listType || listItems.length === 0) return;
    blocks.push({ type: listType, items: [...listItems] });
    listItems.length = 0;
    listType = null;
  };

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const unorderedMatch = line.match(/^-+\s+(.*)$/);
    if (unorderedMatch) {
      flushParagraph();
      if (listType && listType !== "ul") flushList();
      listType = "ul";
      listItems.push(unorderedMatch[1]);
      continue;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      flushParagraph();
      if (listType && listType !== "ol") flushList();
      listType = "ol";
      listItems.push(orderedMatch[1]);
      continue;
    }

    flushList();
    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
}

function AssistantContent({ content }: { content: string }) {
  const blocks = buildRenderBlocks(content);

  return (
    <div className="space-y-3 font-sans text-[15px] leading-7 text-text-primary">
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return <p key={`p-${index}`}>{block.text}</p>;
        }

        if (block.type === "ol") {
          return (
            <ol key={`ol-${index}`} className="list-decimal pl-6 space-y-2 marker:text-text-muted">
              {block.items.map((item, itemIndex) => (
                <li key={`oli-${itemIndex}`}>{item}</li>
              ))}
            </ol>
          );
        }

        return (
          <ul key={`ul-${index}`} className="list-disc pl-6 space-y-2 marker:text-text-muted">
            {block.items.map((item, itemIndex) => (
              <li key={`uli-${itemIndex}`}>{item}</li>
            ))}
          </ul>
        );
      })}
    </div>
  );
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%]">
          <div className="rounded-xl bg-text-primary text-background px-4 py-3">
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
      <div className="w-full">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
          <span className="font-mono text-[9px] uppercase tracking-widest text-accent font-bold">
            Quill
          </span>
        </div>
        <div className="rounded-xl border border-text-primary/25 bg-surface px-4 py-3.5 shadow-[0_1px_0_rgba(36,36,34,0.06)]">
          {message.pending ? (
            <ThinkingDots />
          ) : (
            <AssistantContent content={message.content} />
          )}
        </div>

        {!message.pending && message.sources && message.sources.length > 0 && (
          <div className="mt-2.5">
            <p className="mb-1.5 font-mono text-[9px] uppercase tracking-widest text-text-muted">
              Sources
            </p>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {message.sources.map((src, i) => (
              <SourceCard key={i} title={src.title} url={src.url} />
            ))}
            </div>
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
