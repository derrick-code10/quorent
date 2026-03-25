import type { ConversationListItem } from "../types/api";
import { fmtDate } from "../lib/utils";

interface ConversationListProps {
  conversations: ConversationListItem[];
  activeId: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

function TrashIcon({ className }: { className?: string }) {
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
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

export default function ConversationList({
  conversations,
  activeId,
  loading,
  onSelect,
  onNew,
  onDelete,
}: ConversationListProps) {
  return (
    <aside className="flex flex-col h-full border-r-2 border-text-primary bg-background">
      <div className="p-4 border-b-2 border-text-primary">
        <button
          onClick={onNew}
          className="w-full font-mono text-[10px] uppercase tracking-wider px-4 py-2.5 border-2 border-text-primary bg-background text-text-primary transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(36,36,34,1)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          + New conversation
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[90, 70, 80].map((w, i) => (
              <div
                key={i}
                className="h-3 bg-text-primary/10 animate-pulse rounded"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4">
            <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted">
              No conversations yet
            </p>
          </div>
        ) : (
          <ul>
            {conversations.map((conv) => {
              const isActive = conv.id === activeId;
              return (
                <li
                  key={conv.id}
                  className={`group relative border-b border-text-primary/10 ${isActive ? "bg-text-primary" : "hover:bg-text-primary/5"}`}
                >
                  <button
                    onClick={() => onSelect(conv.id)}
                    className="w-full text-left px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                  >
                    <p
                      className={`font-sans text-xs leading-snug line-clamp-2 ${isActive ? "text-background" : "text-text-primary"}`}
                    >
                      {conv.title}
                    </p>
                    <p
                      className={`font-mono text-[9px] uppercase tracking-widest mt-1 ${isActive ? "text-background/60" : "text-text-muted"}`}
                    >
                      {fmtDate(conv.updated_at)}
                    </p>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(conv.id);
                    }}
                    aria-label="Delete conversation"
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none rounded ${isActive ? "text-background/70 hover:text-background" : "text-text-muted hover:text-text-primary"}`}
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
