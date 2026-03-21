import { Link, useLocation } from "wouter";
import { Search, BookOpen, Layers3, Camera, Heart, GraduationCap } from "lucide-react";
import { PerplexityAttribution } from "./PerplexityAttribution";

const navItems = [
  { path: "/", icon: Search, label: "Search" },
  { path: "/collection", icon: BookOpen, label: "Collection" },
  { path: "/decks", icon: Layers3, label: "Decks" },
  { path: "/wishlist", icon: Heart, label: "Wishlist" },
  { path: "/learn", icon: GraduationCap, label: "Learn" },
  { path: "/scanner", icon: Camera, label: "Scanner" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header — gold bottom border, subtle gradient */}
      <header className="sticky top-0 z-50 border-b-2 border-primary/40 bg-gradient-to-b from-card/95 to-card/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer" data-testid="logo-link">
              <MtgLogo />
              <span className="text-lg font-bold tracking-tight text-primary">
                Deck Centre
              </span>
            </div>
          </Link>
          <nav className="flex items-center gap-1" data-testid="nav-tabs">
            {navItems.map((item) => {
              const isActive =
                location === item.path ||
                (item.path === "/" && location === "/search") ||
                (item.path !== "/" && location.startsWith(item.path));
              return (
                <Link key={item.path} href={item.path}>
                  <button
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                    }`}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 px-4 text-center">
        <PerplexityAttribution />
      </footer>
    </div>
  );
}

function MtgLogo() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-label="MTG Deck Centre"
      className="text-primary"
    >
      {/* Pentagon shape - inspired by mana symbols */}
      <path
        d="M14 2L25.5 10.5L21 24H7L2.5 10.5L14 2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Inner star */}
      <path
        d="M14 7L17.5 13L14 19L10.5 13L14 7Z"
        fill="currentColor"
        opacity="0.25"
      />
      <path
        d="M14 7L17.5 13L14 19L10.5 13L14 7Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Lightning bolt accent */}
      <path
        d="M13 10L15 13H12.5L14.5 17"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
