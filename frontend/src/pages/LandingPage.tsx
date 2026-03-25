import GoogleSignInButton from "../components/GoogleSignInButton";
import illustrationOne from "../assets/illustration-one.png";
import illustrationTwo from "../assets/illustration-two.png";
import { stories, briefs, benefitsList, sectionNav } from "../data/newsContent";
import { greeting } from "../lib/utils";

const currentDate = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default function LandingPage() {
  return (
    <div className="min-h-screen flex bg-background text-text-primary font-sans antialiased overflow-hidden">
      <div className="hidden lg:flex flex-1 flex-col border-r-4 border-text-primary overflow-hidden relative">
        <header className="border-b-4 border-text-primary px-10 pt-8 pb-0 bg-background shrink-0">
          <div className="flex items-center gap-0 mb-3">
            <div className="h-px flex-1 bg-text-primary" />
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] px-4 text-text-muted">
              Est. {new Date().getFullYear()} · Personalized AI Intelligence
            </span>
            <div className="h-px flex-1 bg-text-primary" />
          </div>

          <div className="relative flex items-end justify-between pb-4 border-b-2 border-text-primary">
            <div className="absolute inset-x-0 flex flex-col items-center pointer-events-none">
              <h1
                className="font-serif leading-none text-text-primary uppercase select-none"
                style={{
                  fontSize: "clamp(3.5rem, 6vw, 5.5rem)",
                  letterSpacing: "-0.025em",
                  fontWeight: 700,
                }}
              >
                Quorent
              </h1>
              <p className="font-mono text-sm uppercase tracking-[0.25em] text-accent mt-1">
                Daily Chronicle
              </p>
            </div>
            <div className="invisible">
              <h1 style={{ fontSize: "clamp(3.5rem, 6vw, 5.5rem)" }}>&nbsp;</h1>
              <p className="font-mono text-sm mt-1">&nbsp;</p>
            </div>
            <div className="text-right pb-1 space-y-1">
              <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-secondary border border-secondary px-2 py-0.5 inline-block">
                Vol. I · No. 1
              </p>
              <p className="font-mono text-[10px] text-text-muted block">
                {currentDate}
              </p>
              <p className="font-mono text-[10px] font-bold uppercase text-text-primary block">
                Price: Free to Subscribers
              </p>
            </div>
          </div>

          <div className="flex gap-6 py-2 font-mono text-[9px] uppercase tracking-[0.2em] font-bold text-text-primary overflow-hidden">
            {sectionNav.map((s) => (
              <span
                key={s}
                className="hover:text-primary transition-colors cursor-default whitespace-nowrap"
              >
                {s}
              </span>
            ))}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-10 py-6 custom-scrollbar">
          <div className="grid grid-cols-12 gap-0 border-t-2 border-text-primary pt-6">
            <article className="col-span-8 pr-8 border-r-2 border-text-primary">
              <p className="font-mono text-[9px] uppercase tracking-widest text-secondary font-bold mb-2">
                {stories[0].category}
              </p>
              <h2
                className="font-serif font-bold leading-[1.05] text-text-primary mb-3"
                style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)" }}
              >
                {stories[0].headline}
              </h2>
              <p className="font-mono text-[10px] text-text-muted italic mb-4">
                {stories[0].byline}
              </p>

              <div className="flex items-center gap-3 mb-5">
                <div className="h-px flex-1 bg-text-primary/20" />
                <span className="font-mono text-[9px] text-accent">●</span>
                <div className="h-px flex-1 bg-text-primary/20" />
              </div>

              <div className="w-full mb-5 relative overflow-hidden border border-text-primary/20">
                <img
                  src={illustrationOne}
                  alt="Illustration of AI synthesis in a vintage newspaper press room"
                  className="w-full object-cover"
                />
                <span className="absolute bottom-2 right-3 bg-background/90 text-text-primary font-mono text-[9px] px-2 py-0.5 uppercase tracking-wider">
                  AI Synthesis, {new Date().getFullYear()}
                </span>
              </div>

              <p className="font-serif text-base leading-relaxed text-text-primary first-letter:text-5xl first-letter:font-bold first-letter:mr-2 first-letter:float-left first-letter:leading-[0.85] first-letter:text-secondary">
                {stories[0].excerpt} Sources from across the financial sector
                confirm that the acceleration is not merely computational — the
                models now exhibit contextual judgment previously considered the
                exclusive province of seasoned analysts.
              </p>
              <p className="font-serif text-sm leading-relaxed text-text-muted mt-4">
                The implications for the broader information economy are
                profound. Editors and publishers face a fundamental reckoning:
                in a world of instantaneous, personalized synthesis, the
                question is no longer <em>what</em> is published, but{" "}
                <em>for whom</em>.
              </p>
            </article>

            <aside className="col-span-4 pl-6 flex flex-col gap-0">
              <div className="mb-6">
                <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold border-b-2 border-text-primary pb-2 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block" />
                  Flash Briefs
                </h3>
                <ul className="divide-y divide-text-primary/10">
                  {briefs.map((b, i) => (
                    <li key={i} className="py-3 group cursor-default">
                      <span className="font-mono text-[9px] text-accent font-bold block mb-1 tracking-wider">
                        {b.time}
                      </span>
                      <p className="font-serif text-sm leading-snug text-text-primary group-hover:text-primary transition-colors">
                        {b.text}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t-2 border-text-primary pt-4 mb-4">
                <p className="font-mono text-[9px] uppercase tracking-widest font-bold text-text-primary mb-3">
                  Also This Morning
                </p>
              </div>
              {stories.slice(1, 3).map((s, i) => (
                <div
                  key={i}
                  className="mb-5 pb-5 border-b border-text-primary/20 last:border-0 cursor-default group"
                >
                  <p className="font-mono text-[8px] uppercase tracking-widest text-secondary font-bold mb-1">
                    {s.category}
                  </p>
                  <h4 className="font-serif text-sm font-bold leading-snug text-text-primary group-hover:text-primary transition-colors mb-1">
                    {s.headline}
                  </h4>
                  <p className="font-mono text-[9px] text-text-muted italic">
                    {s.byline}
                  </p>
                </div>
              ))}

              <blockquote className="border-l-4 border-accent pl-4 mt-2">
                <p className="font-serif text-sm italic leading-relaxed text-text-primary">
                  "The morning brief that arrives before you reach for the
                  kettle — that is the ambition."
                </p>
                <footer className="font-mono text-[9px] text-text-muted mt-2 uppercase tracking-wider">
                  — Quorent Editorial
                </footer>
              </blockquote>
            </aside>
          </div>

          <div className="border-t-2 border-text-primary mt-6 pt-6 grid grid-cols-3 gap-6">
            {stories.slice(1).map((s, i) => (
              <div key={i} className="cursor-default group">
                <p className="font-mono text-[8px] uppercase tracking-widest text-secondary font-bold mb-1">
                  {s.category}
                </p>
                <h4 className="font-serif text-sm font-bold leading-snug group-hover:text-primary transition-colors mb-2">
                  {s.headline}
                </h4>
                <p className="font-serif text-xs text-text-muted leading-relaxed">
                  {s.excerpt.slice(0, 90)}…
                </p>
              </div>
            ))}
          </div>
        </main>
      </div>

      <div className="w-full lg:w-[460px] shrink-0 flex flex-col items-center justify-start pt-16 sm:pt-20 px-8 sm:px-12 pb-8 bg-surface relative">
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(#242422 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        <div className="lg:hidden absolute top-6 left-6 right-6 flex items-end justify-between border-b-2 border-text-primary pb-3">
          <h1
            className="font-serif text-3xl font-bold uppercase"
            style={{ letterSpacing: "-0.02em" }}
          >
            Quorent
          </h1>
          <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted">
            Daily Chronicle
          </p>
        </div>

        <div className="w-full max-w-[340px] relative z-10 mt-10">
          <div className="flex justify-center mb-6">
            <img
              src={illustrationTwo}
              alt="Quorent globe vignette"
              className="w-72 opacity-20"
            />
          </div>

          <div className="h-1 bg-text-primary mb-6" />

          <div className="mb-8">
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-secondary font-bold mb-3">
              Subscriber Access
            </p>
            <h2 className="font-serif text-4xl font-bold text-text-primary leading-none mb-3">
              {greeting()},
              <br />
              reader.
            </h2>
            <p className="font-sans text-sm text-text-muted leading-relaxed">
              Sign in to receive your personalized AI digest — curated from
              thousands of sources and delivered before dawn.
            </p>
          </div>

          <GoogleSignInButton />

          <div className="flex items-center gap-3 my-6">
            <div className="h-px flex-1 bg-text-primary/15" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-text-muted">
              Only method available
            </span>
            <div className="h-px flex-1 bg-text-primary/15" />
          </div>

          <ul className="space-y-3 mb-8">
            {benefitsList.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="font-mono text-accent font-bold text-sm mt-px shrink-0">
                  ✦
                </span>
                <span className="font-sans text-xs text-text-muted leading-relaxed">
                  {item}
                </span>
              </li>
            ))}
          </ul>

          <div className="h-px bg-text-primary/10 mb-4" />
          <p className="font-mono text-[9px] text-text-muted uppercase tracking-wider text-center">
            By signing in you agree to our{" "}
            <a
              href="#"
              className="text-primary underline underline-offset-2 hover:text-secondary transition-colors"
            >
              Terms of Service
            </a>
          </p>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: var(--color-background); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-text-primary); opacity: 0.4; }
      `}</style>
    </div>
  );
}
