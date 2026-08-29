import { useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

export default function CursorGlow() {
  const isMobile = useIsMobile();
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const springX = useSpring(mouseX, { damping: 25, stiffness: 150, mass: 0.5 });
  const springY = useSpring(mouseY, { damping: 25, stiffness: 150, mass: 0.5 });

  useEffect(() => {
    if (isMobile) return;
    const handler = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handler, { passive: true });
    return () => window.removeEventListener("mousemove", handler);
  }, [mouseX, mouseY, isMobile]);

  if (isMobile) return null;

  return (
    <motion.div
      className="pointer-events-none fixed top-0 left-0 z-40 mix-blend-screen"
      style={{
        x: springX,
        y: springY,
        width: 300,
        height: 300,
        marginLeft: -150,
        marginTop: -150,
        background:
          "radial-gradient(circle, hsl(155 80% 50% / 0.12) 0%, hsl(200 80% 55% / 0.06) 40%, transparent 70%)",
        borderRadius: "50%",
        filter: "blur(2px)",
      }}
    />
  );
}
