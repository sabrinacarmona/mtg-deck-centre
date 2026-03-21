import type { DeckCard } from "@shared/schema";

const colorConfig: Record<string, { label: string; color: string }> = {
  W: { label: "White", color: "#f0e6b6" },
  U: { label: "Blue", color: "#0e68ab" },
  B: { label: "Black", color: "#555555" },
  R: { label: "Red", color: "#d3202a" },
  G: { label: "Green", color: "#00733e" },
  C: { label: "Colorless", color: "#999999" },
};

interface ColorDistributionProps {
  cards: DeckCard[];
}

export default function ColorDistribution({ cards }: ColorDistributionProps) {
  const counts: Record<string, number> = {};
  let total = 0;

  for (const card of cards) {
    const qty = card.quantity || 1;
    const colors: string[] = card.colors ? JSON.parse(card.colors) : [];
    if (colors.length === 0) {
      counts["C"] = (counts["C"] || 0) + qty;
      total += qty;
    } else {
      for (const c of colors) {
        counts[c] = (counts[c] || 0) + qty;
        total += qty;
      }
    }
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        Add cards to see color distribution
      </div>
    );
  }

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-2" data-testid="color-distribution">
      {/* Stacked bar */}
      <div className="flex h-4 rounded-full overflow-hidden">
        {entries.map(([color, count]) => {
          const pct = (count / total) * 100;
          const cfg = colorConfig[color];
          return (
            <div
              key={color}
              style={{ width: `${pct}%`, backgroundColor: cfg?.color || "#999" }}
              className="transition-all duration-300"
              title={`${cfg?.label || color}: ${count} (${Math.round(pct)}%)`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {entries.map(([color, count]) => {
          const cfg = colorConfig[color];
          return (
            <div key={color} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: cfg?.color || "#999" }}
              />
              <span>{cfg?.label || color}</span>
              <span className="font-medium text-foreground">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
