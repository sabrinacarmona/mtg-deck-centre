import type { DeckCard } from "@shared/schema";

interface ManaCurveProps {
  cards: DeckCard[];
}

export default function ManaCurve({ cards }: ManaCurveProps) {
  // Build mana cost distribution
  const distribution: Record<string, number> = {};
  let maxCount = 0;

  for (const card of cards) {
    const cmc = Math.min(card.cmc || 0, 7); // Group 7+ together
    const key = cmc >= 7 ? "7+" : String(cmc);
    const qty = card.quantity || 1;
    distribution[key] = (distribution[key] || 0) + qty;
    if (distribution[key] > maxCount) maxCount = distribution[key];
  }

  const labels = ["0", "1", "2", "3", "4", "5", "6", "7+"];

  if (cards.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        Add cards to see the mana curve
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="mana-curve">
      <div className="flex items-end gap-1 h-24">
        {labels.map((label) => {
          const count = distribution[label] || 0;
          const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
          return (
            <div key={label} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-muted-foreground font-medium">
                {count || ""}
              </span>
              <div className="w-full flex items-end" style={{ height: "64px" }}>
                <div
                  className="w-full rounded-t bg-primary/80 transition-all duration-300"
                  style={{ height: `${Math.max(height, count > 0 ? 4 : 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1">
        {labels.map((label) => (
          <div
            key={label}
            className="flex-1 text-center text-[10px] text-muted-foreground font-medium"
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
