import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "../lib/supabase";
import { useDashboard } from "../hooks/useDashboard";
import { greeting, fmtDate, TODAY } from "../lib/utils";
import DotGrid from "../components/DotGrid";
import SectionLabel from "../components/SectionLabel";
import DigestPanel from "../components/DigestPanel";
import {
  ArticleCard,
  ArticlesSkeleton,
  EmptyArticles,
} from "../components/ArticleCard";
import Pagination from "../components/Pagination";

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="text-right">
      <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted mb-0.5">
        {label}
      </p>
      {value === null ? (
        <div className="h-7 w-8 bg-text-primary/10 animate-pulse ml-auto rounded" />
      ) : (
        <p className="font-serif text-2xl font-bold text-text-primary leading-none">
          {value}
        </p>
      )}
    </div>
  );
}

function DeliveryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <dt className="font-mono text-[9px] uppercase tracking-widest text-text-muted">
        {label}
      </dt>
      <dd className="font-mono text-[9px] uppercase font-bold text-text-primary">
        {value}
      </dd>
    </div>
  );
}

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

export default function Dashboard() {
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const {
    user,
    articles,
    articleCount,
    digest,
    page,
    totalPages,
    loadingUser,
    loadingArticles,
    loadingDigest,
    articlesError,
    goToPage,
  } = useDashboard();

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      navigate("/", { replace: true });
    } catch {
      setSigningOut(false);
    }
  }

  const firstName = user?.full_name?.split(" ")[0] ?? "reader";

  return (
    <div className="min-h-screen bg-background text-text-primary font-sans antialiased">
      <DotGrid />

      <header className="border-b-4 border-text-primary bg-background sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex items-center py-2">
            <div className="h-px flex-1 bg-text-primary" />
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] px-4 text-text-muted">
              Est. {new Date().getFullYear()} · Personalized AI Intelligence
            </span>
            <div className="h-px flex-1 bg-text-primary" />
          </div>

          <div className="flex items-end justify-between pb-4 border-b-2 border-text-primary">
            <div>
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
                Daily Chronicle
              </p>
            </div>

            <div className="flex items-center gap-4 pb-1">
              <div className="text-right hidden sm:block">
                <p className="font-mono text-[10px] text-text-muted">{TODAY}</p>
                {!loadingUser && user && (
                  <p className="font-mono text-[10px] text-text-primary font-bold">
                    {user.full_name || user.email}
                  </p>
                )}
              </div>

              <button
                onClick={() => navigate("/settings")}
                aria-label="Settings"
                className="p-1.5 text-text-muted hover:text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              >
                <GearIcon className="w-5 h-5" />
              </button>

              <button
                onClick={() => navigate("/chat")}
                className="font-mono text-[10px] uppercase tracking-wider px-4 py-2 border-2 border-text-primary bg-background text-text-primary transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(36,36,34,1)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Ask Quill
              </button>

              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="font-mono text-[10px] uppercase tracking-wider px-4 py-2 bg-text-primary text-background transition-all hover:opacity-80 disabled:opacity-50 focus:outline-none"
              >
                {signingOut ? "…" : "Sign Out"}
              </button>
            </div>
          </div>

          <div className="flex gap-6 py-2 font-mono text-[9px] uppercase tracking-[0.2em] font-bold overflow-hidden">
            {["Today's Digest", "Your Articles", "Interests", "Delivery"].map(
              (s) => (
                <span
                  key={s}
                  className="hover:text-primary transition-colors cursor-default whitespace-nowrap"
                >
                  {s}
                </span>
              ),
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-8 relative z-10">
        <div className="border-b-2 border-text-primary pb-5 mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-secondary font-bold mb-1">
              Subscriber Dashboard
            </p>
            <h2
              className="font-serif font-bold leading-none"
              style={{
                fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                letterSpacing: "-0.02em",
              }}
            >
              {greeting()},{" "}
              {loadingUser ? (
                <span className="inline-block w-24 h-7 bg-text-primary/10 animate-pulse align-middle rounded" />
              ) : (
                firstName
              )}
              .
            </h2>
          </div>

          <div className="hidden sm:flex items-end gap-8 shrink-0">
            <Stat
              label="Articles"
              value={loadingArticles ? null : articleCount}
            />
            <Stat
              label="Interests"
              value={loadingUser ? null : (user?.interests.length ?? 0)}
            />
            <div className="text-right">
              <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted mb-0.5">
                Last Digest
              </p>
              <p className="font-serif text-sm font-bold">
                {loadingDigest
                  ? "—"
                  : digest
                    ? fmtDate(digest.created_at)
                    : "None yet"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          <aside className="col-span-12 lg:col-span-4 space-y-8">
            <DigestPanel digest={digest} loading={loadingDigest} />

            <div>
              <SectionLabel color="bg-accent">Your Interests</SectionLabel>
              {loadingUser ? (
                <div className="flex flex-wrap gap-2">
                  {[80, 60, 95, 70].map((w, i) => (
                    <div
                      key={i}
                      className="h-7 bg-text-primary/10 animate-pulse"
                      style={{ width: w }}
                    />
                  ))}
                </div>
              ) : user && user.interests.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.interests.map((interest) => (
                    <span
                      key={interest}
                      className="font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 border border-text-primary"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="font-sans text-sm text-text-muted">
                  No interests configured.
                </p>
              )}
            </div>

            {!loadingUser && user && (
              <div>
                <SectionLabel color="bg-primary">Delivery</SectionLabel>
                <dl className="space-y-2.5">
                  <DeliveryRow
                    label="Email digest"
                    value={user.email_digest_enabled ? "Enabled" : "Disabled"}
                  />
                  {user.preferred_digest_time && (
                    <DeliveryRow
                      label="Time"
                      value={user.preferred_digest_time}
                    />
                  )}
                  <DeliveryRow
                    label="Timezone"
                    value={user.preferred_digest_timezone}
                  />
                </dl>
              </div>
            )}

            <div className="border-2 border-text-primary p-5 bg-surface">
              <p className="font-mono text-[9px] uppercase tracking-widest text-secondary font-bold mb-2">
                Meet Quill
              </p>
              <p className="font-serif text-sm leading-relaxed text-text-primary mb-4">
                Your AI correspondent. Ask anything about your articles.
              </p>
              <button
                onClick={() => navigate("/chat")}
                className="w-full flex items-center justify-between bg-text-primary text-background font-mono text-[10px] uppercase tracking-wider py-3 px-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(129,103,41,1)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <span>Ask Quill</span>
                <span className="text-base leading-none">→</span>
              </button>
            </div>
          </aside>

          <section className="col-span-12 lg:col-span-8 lg:border-l-2 lg:border-text-primary lg:pl-8">
            <div className="flex items-center justify-between mb-6">
              <SectionLabel color="bg-text-primary">
                Recent Articles
              </SectionLabel>
              {!loadingArticles && articleCount > 0 && (
                <span className="font-mono text-[9px] uppercase tracking-widest text-text-muted -mt-4">
                  {articleCount} article{articleCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {loadingArticles ? (
              <ArticlesSkeleton />
            ) : articlesError ? (
              <div className="border-l-4 border-red-400 pl-4 py-2">
                <p className="font-mono text-[10px] uppercase tracking-widest text-red-600 font-bold mb-1">
                  Failed to load articles
                </p>
                <p className="font-sans text-sm text-text-muted">
                  Could not reach the API. Please try again later.
                </p>
              </div>
            ) : articles.length === 0 ? (
              <EmptyArticles />
            ) : (
              <>
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                />
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
