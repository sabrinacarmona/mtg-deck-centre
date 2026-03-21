import { Link, useLocation } from "wouter";
import { Search, BookOpen, Layers3, Camera, Heart, GraduationCap, Swords, Gamepad2, Hand } from "lucide-react";
import { PerplexityAttribution } from "./PerplexityAttribution";

const navItems = [
  { path: "/", icon: Search, label: "Search" },
  { path: "/collection", icon: BookOpen, label: "Collection" },
  { path: "/decks", icon: Layers3, label: "Decks" },
  { path: "/wishlist", icon: Heart, label: "Wishlist" },
  { path: "/learn", icon: GraduationCap, label: "Learn" },
  { path: "/rivals", icon: Swords, label: "Rivals" },
  { path: "/game-night", icon: Gamepad2, label: "Game Night" },
  { path: "/goldfish", icon: Hand, label: "Goldfish" },
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
                Sabrina's Vault
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
      width="30"
      height="30"
      viewBox="0 0 30 30"
      fill="none"
      aria-label="Sabrina's Vault"
      className="text-primary"
    >
      {/* Vault door - outer circle */}
      <circle cx="15" cy="15" r="13" stroke="currentColor" strokeWidth="1.8" />
      {/* Inner ring */}
      <circle cx="15" cy="15" r="9.5" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      {/* Vault handle/wheel - cross */}
      <line x1="15" y1="7" x2="15" y2="23" stroke="currentColor" strokeWidth="1.4" opacity="0.6" />
      <line x1="7" y1="15" x2="23" y2="15" stroke="currentColor" strokeWidth="1.4" opacity="0.6" />
      {/* Center gem - diamond shape */}
      <path
        d="M15 10L19 15L15 20L11 15Z"
        fill="currentColor"
        opacity="0.3"
      />
      <path
        d="M15 10L19 15L15 20L11 15Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {/* S monogram */}
      <text
        x="15"
        y="16.5"
        textAnchor="middle"
        fill="currentColor"
        fontSize="7"
        fontWeight="bold"
        fontFamily="serif"
      >
        S
      </text>
    </svg>
  );
}
