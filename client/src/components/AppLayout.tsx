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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { PerplexityAttribution } from "./PerplexityAttribution";

/* ── Navigation config ─────────────────────────────── */

const mainNavItems = [
  { path: "/", icon: Search, label: "Search" },
  { path: "/collection", icon: BookOpen, label: "Collection" },
  { path: "/decks", icon: Layers3, label: "Decks" },
  { path: "/game-night", icon: Gamepad2, label: "Game Night" },
];

const toolsNavItems = [
  { path: "/goldfish", icon: Hand, label: "Goldfish" },
  { path: "/matchups", icon: BarChart3, label: "Matchups" },
  { path: "/rivals", icon: Swords, label: "Rivals" },
  { path: "/scanner", icon: Camera, label: "Scanner" },
];

const personalNavItems = [
  { path: "/wishlist", icon: Heart, label: "Wishlist" },
  { path: "/learn", icon: GraduationCap, label: "Learn" },
];

const allNavItems = [...mainNavItems, ...toolsNavItems, ...personalNavItems];

/* Mobile-specific groupings */
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

/* ── Helpers ───────────────────────────────────────── */

function isActive(location: string, path: string) {
  if (path === "/" && (location === "/" || location === "/search")) return true;
  if (path !== "/" && location.startsWith(path)) return true;
  return false;
}

/* ── Desktop Sidebar ─────────────────────────────── */

function DesktopSidebar({ location, collapsed, onToggle }: { location: string; collapsed: boolean; onToggle: () => void }) {
  return (
    <aside
      className={`hidden lg:flex flex-col fixed top-0 left-0 h-full z-40 transition-all duration-300 ease-out sidebar-glow ${
        collapsed ? "w-[68px]" : "w-[220px]"
      }`}
      style={{ background: "hsl(28 22% 8%)" }}
      data-testid="desktop-sidebar"
    >
      {/* Logo */}
      <div className="px-4 pt-5 pb-4 flex items-center gap-2.5">
        <Link href="/">
          <div className="flex items-center gap-2.5 cursor-pointer" data-testid="logo-link">
            <VaultLogo />
            {!collapsed && (
              <span className="font-display text-base font-bold tracking-tight text-primary whitespace-nowrap">
                Sabrina's Vault
              </span>
            )}
          </div>
        </Link>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 px-2 space-y-5 overflow-y-auto overflow-x-hidden">
        <NavSection label="Main" collapsed={collapsed}>
          {mainNavItems.map((item) => (
            <SidebarLink key={item.path} item={item} location={location} collapsed={collapsed} />
          ))}
        </NavSection>

        <NavSection label="Tools" collapsed={collapsed}>
          {toolsNavItems.map((item) => (
            <SidebarLink key={item.path} item={item} location={location} collapsed={collapsed} />
          ))}
        </NavSection>

        <NavSection label="Personal" collapsed={collapsed}>
          {personalNavItems.map((item) => (
            <SidebarLink key={item.path} item={item} location={location} collapsed={collapsed} />
          ))}
        </NavSection>
      </nav>

      {/* Collapse toggle */}
      <div className="px-2 pb-3 pt-1">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-2 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-xs"
          data-testid="sidebar-toggle"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>

      {/* Attribution */}
      {!collapsed && (
        <div className="px-3 pb-4">
          <PerplexityAttribution />
        </div>
      )}
    </aside>
  );
}

function NavSection({ label, collapsed, children }: { label: string; collapsed: boolean; children: React.ReactNode }) {
  return (
    <div>
      {!collapsed && (
        <div className="px-2 mb-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            {label}
          </span>
        </div>
      )}
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function SidebarLink({
  item,
  location,
  collapsed,
}: {
  item: { path: string; icon: any; label: string };
  location: string;
  collapsed: boolean;
}) {
  const active = isActive(location, item.path);
  return (
    <Link href={item.path}>
      <button
        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
          active
            ? "bg-primary/15 text-primary shadow-sm shadow-primary/10"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
        } ${collapsed ? "justify-center px-0" : ""}`}
        data-testid={`nav-${item.label.toLowerCase()}`}
        title={collapsed ? item.label : undefined}
      >
        <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? "text-primary" : ""}`} />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </button>
    </Link>
  );
}

/* ── Medium screen top nav (md but not lg) ───────── */

function TabletTopNav({ location }: { location: string }) {
  return (
    <header className="hidden md:flex lg:hidden sticky top-0 z-50 border-b border-primary/20 bg-background/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto w-full px-4 py-2.5 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer" data-testid="logo-link-tablet">
            <VaultLogo />
            <span className="font-display text-base font-bold tracking-tight text-primary">
              Sabrina's Vault
            </span>
          </div>
        </Link>
        <nav className="flex items-center gap-0.5" data-testid="nav-tabs">
          {allNavItems.map((item) => {
            const active = isActive(location, item.path);
            return (
              <Link key={item.path} href={item.path}>
                <button
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                  }`}
                  data-testid={`tab-nav-${item.label.toLowerCase()}`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
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
      className="fixed bottom-0 inset-x-0 z-50 md:hidden border-t border-primary/20 bg-background/90 backdrop-blur-xl safe-area-bottom"
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
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 inset-x-0 z-[70] md:hidden animate-slide-up">
        <div className="bg-card border-t border-primary/20 rounded-t-2xl px-4 pt-3 pb-6 safe-area-bottom">
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

/* ── Mobile Header ─────────────────────────────────── */

function MobileHeader({ location }: { location: string }) {
  return (
    <header className="sticky top-0 z-50 md:hidden border-b border-primary/20 bg-background/90 backdrop-blur-xl">
      <div className="px-4 py-3 flex items-center gap-2">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer" data-testid="logo-link-mobile">
            <VaultLogo />
            <span className="font-display text-base font-bold tracking-tight text-primary">
              Sabrina's Vault
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
}

/* ── Main layout ───────────────────────────────────── */

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <DesktopSidebar
        location={location}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((p) => !p)}
      />

      {/* Main content area */}
      <div
        className={`flex flex-col flex-1 min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? "lg:ml-[68px]" : "lg:ml-[220px]"
        }`}
      >
        {/* Mobile header */}
        <MobileHeader location={location} />

        {/* Tablet top nav */}
        <TabletTopNav location={location} />

        {/* Main content */}
        <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 py-4 md:py-6 pb-20 md:pb-6 lg:px-6 lg:py-8">
          {children}
        </main>

        {/* Footer (desktop only, not in sidebar) */}
        <footer className="hidden md:block lg:hidden border-t border-border py-4 px-4 text-center">
          <PerplexityAttribution />
        </footer>
      </div>

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

/* ── Vault Logo (premium version) ────────────────── */

function VaultLogo() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      aria-label="Sabrina's Vault"
      className="flex-shrink-0"
    >
      {/* Outer ring */}
      <circle cx="16" cy="16" r="14" stroke="hsl(43 70% 52%)" strokeWidth="1.5" opacity="0.8" />
      {/* Inner ring */}
      <circle cx="16" cy="16" r="10" stroke="hsl(43 70% 52%)" strokeWidth="0.8" opacity="0.25" />
      {/* Cross lines */}
      <line x1="16" y1="6" x2="16" y2="26" stroke="hsl(43 70% 52%)" strokeWidth="0.8" opacity="0.2" />
      <line x1="6" y1="16" x2="26" y2="16" stroke="hsl(43 70% 52%)" strokeWidth="0.8" opacity="0.2" />
      {/* Diamond shape */}
      <path d="M16 9L21 16L16 23L11 16Z" fill="hsl(43 70% 52%)" opacity="0.15" />
      <path d="M16 9L21 16L16 23L11 16Z" stroke="hsl(43 70% 52%)" strokeWidth="1.2" strokeLinejoin="round" opacity="0.7" />
      {/* S monogram */}
      <text x="16" y="17.5" textAnchor="middle" fill="hsl(43 70% 52%)" fontSize="8" fontWeight="bold" fontFamily="'Cabinet Grotesk', sans-serif">
        S
      </text>
    </svg>
  );
}
