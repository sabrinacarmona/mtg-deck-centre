import { BookOpen, Lightbulb } from "lucide-react";
import { getDeckGuide } from "@/lib/deck-guides";

interface DeckStrategyGuideProps {
  deckName: string;
}

export default function DeckStrategyGuide({ deckName }: DeckStrategyGuideProps) {
  const guide = getDeckGuide(deckName);
  if (!guide) return null;

  return (
    <div className="card-frame p-4 space-y-4">
      <h3 className="text-sm font-semibold border-b border-primary/20 pb-1 flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-primary" />
        Strategy Guide
      </h3>

      <p className="text-sm text-foreground/80">{guide.overview}</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-muted/50 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-primary mb-1">Early Game (T1-4)</h4>
          <p className="text-xs text-foreground/70">{guide.earlyGame}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-primary mb-1">Mid Game (T5-8)</h4>
          <p className="text-xs text-foreground/70">{guide.midGame}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-primary mb-1">Late Game</h4>
          <p className="text-xs text-foreground/70">{guide.lateGame}</p>
        </div>
      </div>

      {guide.keyCards.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-primary mb-2">Key Cards</h4>
          <div className="space-y-1.5">
            {guide.keyCards.map((kc) => (
              <div key={kc.name} className="flex items-start gap-2 text-xs">
                <span className="font-semibold text-foreground shrink-0 min-w-[140px]">{kc.name}</span>
                <span className="text-foreground/60">{kc.tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {guide.combos.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-primary mb-2">Key Combos & Synergies</h4>
          <div className="space-y-2">
            {guide.combos.map((combo, i) => (
              <div key={i} className="bg-muted/30 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  {combo.cards.map((c, j) => (
                    <span key={j}>
                      <span className="text-xs font-medium text-primary">{c}</span>
                      {j < combo.cards.length - 1 && <span className="text-xs text-muted-foreground mx-1">+</span>}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-foreground/60">{combo.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {guide.tips.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-primary mb-2">Pro Tips</h4>
          <ul className="space-y-1">
            {guide.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-foreground/70">
                <Lightbulb className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
