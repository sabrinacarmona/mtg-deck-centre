import ManaCurve from "@/components/ManaCurve";
import ColorDistribution from "@/components/ColorDistribution";
import { getTagColor } from "@/hooks/use-tags";
import type { DeckCard } from "@shared/schema";

interface DeckStatsProps {
  cards: DeckCard[];
  tagCounts?: Record<string, number>;
  onTagFilter?: (tag: string | null) => void;
  activeTagFilter?: string | null;
}

export default function DeckStats({ cards, tagCounts, onTagFilter, activeTagFilter }: DeckStatsProps) {
  const sortedTags = tagCounts
    ? Object.entries(tagCounts).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="card-frame p-4 space-y-3">
        <h3 className="text-sm font-semibold border-b border-primary/20 pb-1">Mana Curve</h3>
        <ManaCurve cards={cards} />
      </div>
      <div className="card-frame p-4 space-y-3">
        <h3 className="text-sm font-semibold border-b border-primary/20 pb-1">Colors</h3>
        <ColorDistribution cards={cards} />
      </div>
      {sortedTags.length > 0 && (
        <div className="card-frame p-4 space-y-3 sm:col-span-2">
          <h3 className="text-sm font-semibold border-b border-primary/20 pb-1">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {sortedTags.map(([tag, count]) => (
              <button
                key={tag}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${getTagColor(tag)} ${
                  activeTagFilter === tag ? "ring-2 ring-primary ring-offset-1 ring-offset-card" : "hover:opacity-80"
                }`}
                onClick={() => onTagFilter?.(activeTagFilter === tag ? null : tag)}
              >
                {tag}
                <span className="opacity-70">{count}</span>
              </button>
            ))}
            {activeTagFilter && (
              <button
                className="px-2.5 py-1 rounded-full text-xs font-medium border border-muted-foreground/30 text-muted-foreground hover:bg-muted transition-colors"
                onClick={() => onTagFilter?.(null)}
              >
                Clear filter
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
