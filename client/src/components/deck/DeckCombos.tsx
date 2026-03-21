import { ChevronDown, ChevronUp, Zap } from "lucide-react";
import { findCombos } from "@/lib/combo-data";
import type { DeckCard } from "@shared/schema";

interface DeckCombosProps {
  cards: DeckCard[];
  open: boolean;
  onToggle: () => void;
}

export default function DeckCombos({ cards, open, onToggle }: DeckCombosProps) {
  const cardNames = cards.map((c) => c.name);
  const commander = cards.find((c) => c.isCommander);
  const comboMatches = findCombos(cardNames, commander?.name);
  const completeCount = comboMatches.filter((m) => m.complete).length;

  return (
    <div className="border border-card-border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-3 bg-card hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Combo Finder</span>
          {comboMatches.length > 0 && (
            <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-medium">
              {completeCount} complete · {comboMatches.length - completeCount} near-miss
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="p-3 border-t border-card-border space-y-2">
          {comboMatches.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No known combos detected in this deck.
            </p>
          ) : (
            comboMatches.map((match, i) => (
              <div
                key={i}
                className={`rounded-lg p-2.5 border ${
                  match.complete
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : "bg-amber-500/5 border-amber-500/20"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  {match.combo.cards.map((c, j) => {
                    const present = match.presentCards.some(
                      (p) => p.toLowerCase() === c.toLowerCase()
                    );
                    return (
                      <span key={j} className="flex items-center">
                        <span
                          className={`text-xs font-medium ${
                            present ? "text-foreground" : "text-red-400 line-through"
                          }`}
                        >
                          {c}
                        </span>
                        {j < match.combo.cards.length - 1 && (
                          <span className="text-xs text-muted-foreground mx-1">+</span>
                        )}
                      </span>
                    );
                  })}
                  {match.complete ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-medium ml-auto">
                      Complete
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-medium ml-auto">
                      Missing: {match.missingCards.join(", ")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-foreground/60">{match.combo.result}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
