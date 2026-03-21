import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Search,
  BookOpen,
  Layers3,
  Camera,
  Heart,
  GraduationCap,
  Swords,
  Gamepad2,
  Hand,
  BarChart3,
  MoreHorizontal,
  X,
} from "lucide-react";
import { PerplexityAttribution } from "./PerplexityAttribution";

/* ── Navigation config ─────────────────────────────── */

const primaryNavItems = [
  { path: "/", icon: Search, label: "Search" },
  { path: "/collection", icon: BookOpen, label: "Collection" },
  { path: "/decks", icon: Layers3, label: "Decks" },
  { path: "/game-night", icon: Gamepad2, label: "Game" },
];

const secondaryNavItems = [
  { path: "/wishlist", icon: Heart, label: "Wishlist" },
  { path: "/learn", icon: GraduationCap, label: "Learn" },
  { path: "/rivals", icon: Swords, label: "Rivals" },
  { path: "/goldfish", icon: Hand, label: "Goldfish" },
  { path: "/matchups", icon: BarChart3, label: "Matchups" },
  { path: "/scanner", icon: Camera, label: "Scanner" },
];

const allNavItems = [...primaryNavItems, ...secondaryNavItems];

/* ── Helpers ───────────────────────────────────────── */

function isActive(location: string, path: string) {
  if (path === "/" && (location === "/" || location === "/search")) return true;
  if (path !== "/" && location.startsWith(path)) return true;
  return false;
}

/* ── Desktop top nav (hidden on mobile) ────────────── */

function DesktopNav({ location }: { location: string }) {
  return (
    <nav className="hidden md:flex items-center gap-0.5" data-testid="nav-tabs">
      {allNavItems.map((item) => {
        const active = isActive(location, item.path);
        return (
          <Link key={item.path} href={item.path}>
            <button
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
              }`}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          </Link>
        );
      })}
    </nav>
  );
}

/* ── Mobile bottom tab bar (visible < md) ──────────── */

function MobileBottomNav({
  location,
  onMoreOpen,
}: {
  location: string;
  onMoreOpen: () => void;
}) {
  const isSecondaryActive = secondaryNavItems.some((item) =>
    isActive(location, item.path)
  );

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 md:hidden border-t-2 border-primary/30 bg-card/95 backdrop-blur-lg safe-area-bottom"
      data-testid="mobile-nav"
    >
      <div className="flex items-stretch justify-around px-1 h-14">
        {primaryNavItems.map((item) => {
          const active = isActive(location, item.path);
          return (
            <Link key={item.path} href={item.path}>
              <button
                className={`flex flex-col items-center justify-center gap-0.5 px-3 h-full transition-colors ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
                data-testid={`mob-nav-${item.label.toLowerCase()}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-none">
                  {item.label}
                </span>
              </button>
            </Link>
          );
        })}

        {/* More button */}
        <button
          className={`flex flex-col items-center justify-center gap-0.5 px-3 h-full transition-colors ${
            isSecondaryActive
              ? "text-primary"
              : "text-muted-foreground"
          }`}
          onClick={onMoreOpen}
          data-testid="mob-nav-more"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-none">More</span>
        </button>
      </div>
    </nav>
  );
}

/* ── Mobile "More" slide-up sheet ──────────────────── */

function MobileMoreSheet({
  open,
  onClose,
  location,
}: {
  open: boolean;
  onClose: () => void;
  location: string;
}) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm md:hidden"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 inset-x-0 z-[70] md:hidden animate-slide-up">
        <div className="bg-card border-t-2 border-primary/30 rounded-t-2xl px-4 pt-3 pb-6 safe-area-bottom">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-foreground/80">More</span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {secondaryNavItems.map((item) => {
              const active = isActive(location, item.path);
              return (
                <Link key={item.path} href={item.path}>
                  <button
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl w-full transition-colors ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                    onClick={onClose}
                    data-testid={`more-${item.label.toLowerCase()}`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Main layout ───────────────────────────────────── */

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b-2 border-primary/40 bg-gradient-to-b from-card/95 to-card/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer" data-testid="logo-link">
              <MtgLogo />
              <span className="text-lg font-bold tracking-tight text-primary">
                Sabrina's Vault
              </span>
            </div>
          </Link>
          <DesktopNav location={location} />
        </div>
      </header>

      {/* Main content — extra bottom padding on mobile for the tab bar */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-4 md:py-6 pb-20 md:pb-6">
        {children}
      </main>

      {/* Footer (hidden on mobile — tab bar takes its place) */}
      <footer className="hidden md:block border-t border-border py-4 px-4 text-center">
        <PerplexityAttribution />
      </footer>

      {/* Mobile bottom nav */}
      <MobileBottomNav location={location} onMoreOpen={() => setMoreOpen(true)} />

      {/* Mobile more sheet */}
      <MobileMoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        location={location}
      />
    </div>
  );
}

function MtgLogo() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 30 30"
      fill="none"
      aria-label="Sabrina's Vault"
      className="text-primary"
    >
      <circle cx="15" cy="15" r="13" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="15" cy="15" r="9.5" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <line x1="15" y1="7" x2="15" y2="23" stroke="currentColor" strokeWidth="1.4" opacity="0.6" />
      <line x1="7" y1="15" x2="23" y2="15" stroke="currentColor" strokeWidth="1.4" opacity="0.6" />
      <path d="M15 10L19 15L15 20L11 15Z" fill="currentColor" opacity="0.3" />
      <path d="M15 10L19 15L15 20L11 15Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <text x="15" y="16.5" textAnchor="middle" fill="currentColor" fontSize="7" fontWeight="bold" fontFamily="serif">
        S
      </text>
    </svg>
  );
}
