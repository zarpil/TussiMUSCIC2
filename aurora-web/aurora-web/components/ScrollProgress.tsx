import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";

const chapters = [
  { id: "hero", label: "Prologue" },
  { id: "about", label: "Origin" },
  { id: "showcase", label: "Showcase" },
  { id: "features", label: "Powers" },
  { id: "commands", label: "Commands" },
  { id: "stats", label: "Impact" },
];

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });
  const [active, setActive] = useState(0);
  const [chapterPct, setChapterPct] = useState(0);

  useEffect(() => {
    // Resolve actual section elements (hero is the first <section>)
    const getEls = () =>
      chapters.map((c) => {
        if (c.id === "hero") return document.querySelector("main section") as HTMLElement | null;
        return document.getElementById(c.id);
      });

    const onScroll = () => {
      const els = getEls();
      const probe = window.innerHeight * 0.35;
      let current = 0;
      els.forEach((el, i) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.top <= probe) current = i;
      });
      setActive(current);

      // Progress through the current chapter (0–100)
      const currentEl = els[current];
      const nextEl = els[current + 1];
      if (currentEl) {
        const start = currentEl.getBoundingClientRect().top + window.scrollY;
        const end = nextEl
          ? nextEl.getBoundingClientRect().top + window.scrollY
          : document.documentElement.scrollHeight - window.innerHeight;
        const span = Math.max(end - start, 1);
        const pct = ((window.scrollY - start) / span) * 100;
        setChapterPct(Math.max(0, Math.min(100, Math.round(pct))));
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const scrollTo = (id: string) => {
    const el = id === "hero" ? document.querySelector("main section") : document.getElementById(id);
    if (el) (el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      {/* Top progress bar */}
      <motion.div
        aria-hidden
        className="fixed top-0 left-0 right-0 h-[2px] origin-left z-[60] bg-gradient-to-r from-aurora-green via-aurora-blue to-aurora-purple"
        style={{ scaleX: progress }}
      />

      {/* Side chapter rail (desktop) */}
      <nav
        aria-label="Story chapters"
        className="hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 z-[55] flex-col gap-3"
      >
        {chapters.map((c, i) => {
          const isActive = i === active;
          return (
            <button
              key={c.id}
              onClick={() => scrollTo(c.id)}
              className="group flex items-center gap-3 justify-end focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-green rounded"
              aria-label={`Go to ${c.label}`}
              aria-current={isActive ? "true" : undefined}
            >
              <span
                className={`text-[11px] font-medium tracking-[0.2em] uppercase transition-all duration-300 ${
                  isActive
                    ? "text-foreground opacity-100 translate-x-0"
                    : "text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-80 group-hover:translate-x-0"
                }`}
              >
                <span className="text-aurora-green/70 mr-2">{String(i + 1).padStart(2, "0")}</span>
                {c.label}
              </span>
              <span className="relative flex items-center justify-center w-4 h-4">
                <span
                  className={`block rounded-full transition-all duration-300 ${
                    isActive
                      ? "w-3 h-3 bg-aurora-green glow-green"
                      : "w-1.5 h-1.5 bg-muted-foreground/40 group-hover:bg-foreground/70"
                  }`}
                />
                {isActive && (
                  <motion.span
                    layoutId="chapter-ring"
                    className="absolute inset-0 rounded-full ring-2 ring-aurora-green/40"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Mobile chapter pill */}
      <div className="lg:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-[55] glass-strong rounded-full pl-4 pr-2 py-1.5 flex items-center gap-2 text-xs">
        <span className="text-aurora-green font-bold tracking-widest">
          {String(active + 1).padStart(2, "0")}
        </span>
        <span className="text-foreground/80 font-medium tracking-wider uppercase">
          {chapters[active]?.label}
        </span>
        <span className="text-muted-foreground/60">/ {chapters.length}</span>
        <span
          className="ml-1 relative flex items-center justify-center w-11 h-6 rounded-full bg-background/50 ring-1 ring-glass-border/15 overflow-hidden"
          aria-label={`Chapter progress ${chapterPct}%`}
        >
          <span
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-aurora-green/30 to-aurora-blue/30 transition-[width] duration-150 ease-out"
            style={{ width: `${chapterPct}%` }}
          />
          <span className="relative font-mono font-semibold text-aurora-green tabular-nums text-[10px]">
            {chapterPct}%
          </span>
        </span>
      </div>
    </>
  );
}
