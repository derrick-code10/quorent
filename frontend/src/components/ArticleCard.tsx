import { fmtDate } from "../lib/utils";
import type { Article } from "../types/api";

function SentimentLabel({ score }: { score: number | null }) {
  if (score === null || score === undefined) return null;
  const [label, color] =
    score > 0.1
      ? ["Positive", "text-green-700"]
      : score < -0.1
        ? ["Negative", "text-red-700"]
        : ["Neutral", "text-text-muted"];
  return (
    <span className={`font-mono text-[8px] uppercase tracking-widest ${color}`}>{label}</span>
  );
}

export function ArticleCard({ article }: { article: Article }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-4 group border-b border-text-primary/15 pb-5 mb-5 last:border-0 last:mb-0"
    >
      {article.image_url && (
        <div className="shrink-0 w-20 h-16 overflow-hidden border border-text-primary/20">
          <img
            src={article.image_url}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {article.source && (
            <span className="font-mono text-[8px] uppercase tracking-widest text-secondary font-bold">
              {article.source}
            </span>
          )}
          <SentimentLabel score={article.sentiment} />
        </div>
        <h4 className="font-serif text-sm font-bold leading-snug text-text-primary group-hover:text-primary transition-colors mb-1">
          {article.title}
        </h4>
        {article.description && (
          <p className="font-sans text-xs text-text-muted leading-relaxed line-clamp-2">
            {article.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          {article.published_at && (
            <span className="font-mono text-[8px] text-text-muted">
              {fmtDate(article.published_at)}
            </span>
          )}
          {article.author && (
            <>
              <span className="text-text-muted/40">·</span>
              <span className="font-mono text-[8px] text-text-muted italic">{article.author}</span>
            </>
          )}
        </div>
      </div>
    </a>
  );
}

export function ArticlesSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 border-b border-text-primary/15 pb-5">
          <div className="shrink-0 w-20 h-16 bg-text-primary/10" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-2 bg-text-primary/10 w-16" />
            <div className="h-3 bg-text-primary/15 w-full" />
            <div className="h-3 bg-text-primary/10 w-4/5" />
            <div className="h-2 bg-text-primary/8 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyArticles() {
  return (
    <div className="py-14 text-center border-2 border-dashed border-text-primary/20">
      <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-secondary font-bold mb-3">
        Edition · Vol. I
      </p>
      <p className="font-serif text-xl font-bold text-text-primary mb-2">
        The presses are warming up.
      </p>
      <p className="font-sans text-sm text-text-muted max-w-xs mx-auto leading-relaxed">
        Your first curated articles are being gathered. Check back after your next scheduled
        digest.
      </p>
    </div>
  );
}
