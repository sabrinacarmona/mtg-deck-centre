import ManaCurve from "@/components/ManaCurve";
import ColorDistribution from "@/components/ColorDistribution";
import type { DeckCard } from "@shared/schema";

interface DeckStatsProps {
  cards: DeckCard[];
}

export default function DeckStats({ cards }: DeckStatsProps) {
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
    </div>
  );
}
