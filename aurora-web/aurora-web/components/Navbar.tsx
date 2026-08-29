import { Button } from "@/components/ui/button";
import { LogIn, Menu, X, Music } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Nosotros", href: "#about" },
  { label: "Características", href: "#features" },
  { label: "Comandos", href: "#commands" },
  { label: "Equipo", href: "#team" },
];

interface NavbarProps {
  initialSettings?: {
    siteName?: string;
    navbarIconUrl?: string;
  };
}

export default function Navbar({ initialSettings }: NavbarProps = {}) {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [siteName, setSiteName] = useState(initialSettings?.siteName ? initialSettings.siteName.toUpperCase() : "");
  const [navbarIconUrl, setNavbarIconUrl] = useState(initialSettings?.navbarIconUrl || "");

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data) {
          if (data.siteName) setSiteName(data.siteName.toUpperCase());
          if (data.navbarIconUrl) setNavbarIconUrl(data.navbarIconUrl);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const sections = navLinks.map(link => link.href.substring(1));
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetHeight = element.offsetHeight;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(`#${section}`);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.div
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="fixed top-3 inset-x-0 z-50 mx-auto w-[calc(100vw-2rem)] sm:w-[calc(100vw-3rem)] max-w-3xl lg:max-w-4xl pointer-events-none"
    >
      <nav className="min-h-16 rounded-full bg-background/30 backdrop-blur-2xl border border-glass-border/10 shadow-[0_4px_30px_rgba(0,0,0,0.4)] px-4 py-2 md:px-6 md:py-3 flex items-center justify-between gap-3 pointer-events-auto">
        {/* Logo */}
        <a 
          href="#" 
          className="flex items-center gap-3 pl-1 md:pl-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-green rounded-full"
        >
          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-foreground/90 flex items-center justify-center">
            <img
              src={navbarIconUrl}
              alt=""
              className="w-full h-full object-cover absolute inset-0"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <Music className="h-4 w-4 text-background z-10" />
          </div>
          <span className="text-white font-black text-sm md:text-base tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 select-none">
            {siteName}
          </span>
        </a>

        {/* Center links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition-all px-3 py-1.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-green ${
                activeSection === l.href
                  ? 'bg-aurora-green/20 text-aurora-green border border-aurora-green/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-glass-border/5'
              }`}
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Right CTA */}
        <div className="hidden md:block">
          <button
            onClick={() => {
              window.location.href = '/api/auth/discord';
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground/90 text-background hover:bg-foreground font-medium text-sm px-4 h-8 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-green focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
          >
            <LogIn className="h-3.5 w-3.5" />
            Iniciar Sesión
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-foreground w-7 h-7 flex items-center justify-center rounded-full hover:bg-glass-border/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-green"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mt-2 rounded-2xl bg-background/40 backdrop-blur-2xl border border-glass-border/10 shadow-[0_4px_30px_rgba(0,0,0,0.4)] overflow-hidden md:hidden pointer-events-auto"
          >
            <div className="flex flex-col gap-1 p-3">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className={`text-sm px-4 py-2.5 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-green ${
                    activeSection === l.href
                      ? 'bg-aurora-green/20 text-aurora-green border border-aurora-green/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-glass-border/5'
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </a>
              ))}
              <button
                onClick={() => {
                  console.log('Mobile login clicked');
                  window.location.href = '/api/auth/discord';
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground/90 text-background hover:bg-foreground font-medium text-sm mt-1 w-full h-9 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-green focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
              >
                <LogIn className="h-3.5 w-3.5" />
                Iniciar Sesión
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
