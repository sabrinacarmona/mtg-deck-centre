import { ChevronDown, ChevronUp, ArrowUpCircle } from "lucide-react";
import { getUpgradeSuggestions } from "@/lib/upgrade-data";
import type { DeckCard } from "@shared/schema";

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  synergy: { label: "Synergy", color: "text-primary" },
  ramp: { label: "Ramp", color: "text-emerald-400" },
  removal: { label: "Removal", color: "text-red-400" },
  draw: { label: "Draw", color: "text-blue-400" },
  protection: { label: "Protection", color: "text-amber-400" },
};

interface DeckUpgradesProps {
  cards: DeckCard[];
  open: boolean;
  onToggle: () => void;
}

export default function DeckUpgrades({ cards, open, onToggle }: DeckUpgradesProps) {
  const commander = cards.find((c) => c.isCommander);
  const suggestions = commander ? getUpgradeSuggestions(commander.name) : [];
  const deckCardNames = new Set(cards.map((c) => c.name.toLowerCase()));
  const filtered = suggestions.filter(
    (s) => !deckCardNames.has(s.cardName.toLowerCase())
  );

  return (
    <div className="border border-card-border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-3 bg-card hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <ArrowUpCircle className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Upgrade Suggestions</span>
          {filtered.length > 0 && (
            <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-medium">
              {filtered.length}
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="p-3 border-t border-card-border space-y-2">
          {!commander ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Set a commander to see upgrade suggestions.
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No upgrade suggestions for {commander.name}, or all suggested cards are already in the deck.
            </p>
          ) : (
            filtered.map((s) => {
              const cat = CATEGORY_LABELS[s.category] || { label: s.category, color: "text-muted-foreground" };
              return (
                <div
                  key={s.cardName}
                  className="flex items-start gap-3 bg-muted/30 rounded-lg p-2.5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-xs font-semibold">{s.cardName}</span>
                      <span className="text-[10px] text-amber-400 font-medium">{s.price}</span>
                      <span className={`text-[10px] ${cat.color} bg-muted px-1.5 py-0.5 rounded`}>
                        {cat.label}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/60">{s.reason}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
