import { useEffect, useRef, ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface Props {
  children: ReactNode;
  className?: string;
  /** Add subtle parallax drift to the whole chapter */
  parallax?: boolean;
}

/**
 * Wraps a section so that headings reveal word-by-word, paragraphs reveal
 * line-by-line, and cards drift into view with depth — like turning the page
 * of a story. Uses GSAP ScrollTrigger driven by Lenis.
 */
export default function StoryReveal({ children, className = "", parallax = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      // 1. Headings — split into words and reveal sequentially
      const headings = root.querySelectorAll<HTMLElement>("h1, h2, h3");
      headings.forEach((h) => {
        if (h.dataset.storySplit === "done") return;
        const text = h.textContent || "";
        const children = Array.from(h.childNodes);
        // Only split if it's plain text or simple inline structure
        const hasComplexChildren = children.some(
          (n) => n.nodeType === 1 && (n as HTMLElement).childElementCount > 0
        );
        if (hasComplexChildren) return;

        h.dataset.storySplit = "done";
        h.innerHTML = text
          .split(/(\s+)/)
          .map((w) =>
            /\s+/.test(w)
              ? w
              : `<span class="story-word" style="display:inline-block;will-change:transform,opacity">${w}</span>`
          )
          .join("");

        const words = h.querySelectorAll<HTMLElement>(".story-word");
        gsap.from(words, {
          yPercent: 110,
          opacity: 0,
          rotateX: -40,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.05,
          scrollTrigger: {
            trigger: h,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        });
      });

      // 2. Paragraphs — soft fade + lift
      const paragraphs = root.querySelectorAll<HTMLElement>("p");
      paragraphs.forEach((p) => {
        gsap.from(p, {
          y: 24,
          opacity: 0,
          duration: 0.9,
          ease: "power2.out",
          scrollTrigger: {
            trigger: p,
            start: "top 88%",
            toggleActions: "play none none reverse",
          },
        });
      });

      // 3. Cards / glass blocks — slide with depth
      const cards = root.querySelectorAll<HTMLElement>(
        "[data-story-card], .glass, .glass-strong"
      );
      cards.forEach((c, i) => {
        gsap.from(c, {
          y: 60,
          opacity: 0,
          scale: 0.96,
          rotateX: 6,
          duration: 1,
          ease: "power3.out",
          delay: (i % 4) * 0.05,
          scrollTrigger: {
            trigger: c,
            start: "top 90%",
            toggleActions: "play none none reverse",
          },
        });
      });

      // 4. Section parallax drift
      if (parallax) {
        gsap.fromTo(
          root,
          { y: 40 },
          {
            y: -40,
            ease: "none",
            scrollTrigger: {
              trigger: root,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      }
    }, root);

    return () => ctx.revert();
  }, [parallax]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
