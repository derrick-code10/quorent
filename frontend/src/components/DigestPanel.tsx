import { fmtDate, fmtTime, DIGEST_STATUS_STYLES } from "../lib/utils";
import SectionLabel from "./SectionLabel";
import type { Digest } from "../types/api";

function SkeletonBlock({ width = "100%" }: { width?: string }) {
  return (
    <div className="h-2.5 bg-text-primary/10 rounded animate-pulse" style={{ width }} />
  );
}

interface DigestPanelProps {
  digest: Digest | null;
  loading: boolean;
}

export default function DigestPanel({ digest, loading }: DigestPanelProps) {
  return (
    <div>
      <SectionLabel color="bg-secondary">Latest Digest</SectionLabel>

      {loading ? (
        <div className="space-y-2">
          <SkeletonBlock width="60%" />
          <SkeletonBlock width="100%" />
          <SkeletonBlock width="85%" />
          <SkeletonBlock width="40%" />
        </div>
      ) : digest ? (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`font-mono text-[8px] uppercase tracking-widest px-2 py-0.5 font-bold ${DIGEST_STATUS_STYLES[digest.status]}`}
            >
              {digest.status}
            </span>
            {digest.is_fallback && (
              <span className="font-mono text-[8px] uppercase tracking-widest text-accent">
                · Cached data
              </span>
            )}
          </div>

          {digest.summary ? (
            <p className="font-serif text-sm leading-relaxed text-text-primary">{digest.summary}</p>
          ) : (
            <p className="font-serif text-sm italic text-text-muted">Summary not available.</p>
          )}

          <p className="font-mono text-[9px] text-text-muted mt-3">
            {fmtDate(digest.created_at)}
            {digest.sent_at && ` · Sent at ${fmtTime(digest.sent_at)}`}
            {digest.article_count > 0 && ` · ${digest.article_count} articles`}
          </p>
        </div>
      ) : (
        <div className="border-l-4 border-text-primary/20 pl-4">
          <p className="font-serif text-sm italic text-text-muted leading-relaxed">
            Your first digest is being prepared. It will arrive at your scheduled time.
          </p>
        </div>
      )}
    </div>
  );
}
