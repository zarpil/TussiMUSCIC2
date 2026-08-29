import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

export default function ScrollStorySection({ children, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.96, 1, 1, 0.96]);

  return (
    <motion.div ref={ref} style={{ y, opacity, scale }} className={className}>
      {children}
    </motion.div>
  );
}
