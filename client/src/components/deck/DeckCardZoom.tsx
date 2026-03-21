import { useEffect } from "react";
import { ManaCost, OracleText } from "@/components/ManaSymbols";
import {
  X,
  Minus,
  Plus,
  Trash2,
  Crown,
  AlertTriangle,
  Lightbulb,
  Tag,
} from "lucide-react";
import { getTagColor } from "@/hooks/use-tags";
import type { DeckCard } from "@shared/schema";

interface DeckCardZoomProps {
  card: DeckCard;
  deckFormat: string;
  onClose: () => void;
  onUpdateQuantity: (id: number, qty: number) => void;
  onRemove: (id: number) => void;
  onToggleCommander: (id: number, isCommander: boolean) => void;
  tags?: string[];
  onTagClick?: (card: DeckCard) => void;
}

export default function DeckCardZoom({
  card,
  deckFormat,
  onClose,
  onUpdateQuantity,
  onRemove,
  onToggleCommander,
  tags = [],
  onTagClick,
}: DeckCardZoomProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const image = card.imageNormal || card.imageSmall;
  const isIllegal = checkIllegal(card, deckFormat);

  let legalityLabel = "";
  if (isIllegal && card.legalities) {
    try {
      const legalities = JSON.parse(card.legalities);
      const status = legalities[deckFormat];
      legalityLabel = `${status === "banned" ? "Banned" : "Not legal"} in ${deckFormat}`;
    } catch { /* ignore */ }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
      data-testid="card-zoom-overlay"
    >
      <div
        className="relative flex flex-col lg:flex-row items-center gap-6 max-w-3xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute -top-2 -right-2 sm:top-0 sm:right-0 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
          onClick={onClose}
          data-testid="card-zoom-close"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {image ? (
          <img
            src={image}
            alt={card.name}
            className="rounded-2xl shadow-2xl max-h-[60vh] lg:max-h-[75vh] w-auto max-w-full"
            data-testid="card-zoom-image"
          />
        ) : (
          <div className="bg-muted rounded-2xl w-[300px] aspect-[5/7] flex items-center justify-center">
            <span className="text-muted-foreground">{card.name}</span>
          </div>
        )}

        <div className="flex flex-col items-center lg:items-start gap-3 text-white w-full lg:w-auto">
          <div>
            <h2 className="text-xl font-bold">{card.name}</h2>
            <p className="text-sm text-white/60">{card.typeLine}</p>
            {card.manaCost && (
              <div className="mt-1">
                <ManaCost cost={card.manaCost} size="md" />
              </div>
            )}
          </div>

          {card.oracleText && (
            <div className="text-sm text-white/80 leading-relaxed max-w-xs">
              {card.oracleText.split("\n").map((line, i) => (
                <span key={i}>
                  {i > 0 && <br />}
                  <OracleText text={line} size="sm" />
                </span>
              ))}
            </div>
          )}

          {getCardTip(card) && (
            <div className="flex items-start gap-2 text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2 max-w-xs backdrop-blur-sm">
              <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <span className="leading-relaxed">{getCardTip(card)}</span>
            </div>
          )}

          {card.power && card.toughness && (
            <p className="text-sm font-semibold text-white/70">
              {card.power}/{card.toughness}
            </p>
          )}

          {card.priceUsd && (
            <p className="text-sm text-amber-400 font-medium">${card.priceUsd}</p>
          )}

          {isIllegal && legalityLabel && (
            <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/20 rounded-lg px-2 py-1">
              <AlertTriangle className="w-3 h-3" />
              {legalityLabel}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg transition-colors ${
                card.isCommander
                  ? "bg-primary/30 text-amber-300"
                  : "bg-white/10 text-white/60 hover:text-white"
              }`}
              onClick={() => onToggleCommander(card.id, !card.isCommander)}
            >
              <Crown className="w-3.5 h-3.5" />
              {card.isCommander ? "Commander" : "Set as Commander"}
            </button>
            {onTagClick && (
              <button
                className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg bg-white/10 text-white/60 hover:text-white transition-colors"
                onClick={() => onTagClick(card)}
              >
                <Tag className="w-3.5 h-3.5" />
                Tags
              </button>
            )}
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getTagColor(tag)}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 mt-2">
            <button
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              onClick={() => onUpdateQuantity(card.id, (card.quantity || 1) - 1)}
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-lg font-bold w-8 text-center">
              {card.quantity || 1}x
            </span>
            <button
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              onClick={() => onUpdateQuantity(card.id, (card.quantity || 1) + 1)}
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              className="w-8 h-8 rounded-lg bg-red-500/30 hover:bg-red-500/50 flex items-center justify-center text-white transition-colors ml-2"
              onClick={() => onRemove(card.id)}
              aria-label="Remove card"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const BASIC_LANDS = ["Plains", "Island", "Swamp", "Mountain", "Forest"];

function getCardTip(card: DeckCard): string | null {
  const oracle = (card.oracleText || "").toLowerCase();
  const typeLine = (card.typeLine || "").toLowerCase();

  if (card.isCommander) {
    return `This is your Commander. Cast from the command zone for ${card.manaCost || "its mana cost"}. Each recast costs {2} more.`;
  }
  if (typeLine.includes("land") && BASIC_LANDS.includes(card.name)) {
    const colorMap: Record<string, string> = { Plains: "white", Island: "blue", Swamp: "black", Mountain: "red", Forest: "green" };
    return `Basic land. Tap for one ${colorMap[card.name] || ""} mana. Play one land per turn.`;
  }
  if (oracle.includes("counter target")) {
    return "Counterspell \u2014 use this to stop an opponent's spell before it resolves.";
  }
  if (oracle.includes("double strike")) {
    return "Double strike deals damage twice \u2014 once as first strike, once as normal combat damage.";
  }
  if (oracle.includes("deathtouch")) {
    return "Deathtouch \u2014 any damage this deals to a creature destroys it.";
  }
  if (oracle.includes("flying")) {
    return "Has Flying \u2014 can only be blocked by creatures with Flying or Reach.";
  }
  if (oracle.includes("trample")) {
    return "Has Trample \u2014 excess combat damage carries over to the defending player.";
  }
  if (oracle.includes("haste")) {
    return "Has Haste \u2014 can attack the turn it enters the battlefield.";
  }
  if (typeLine.includes("creature") && parseInt(card.power || "0") >= 5) {
    return `Big threat. ${card.power} power can close games fast. Watch for removal.`;
  }
  if (oracle.includes("draw") && oracle.includes("card")) {
    return "Card draw \u2014 card advantage is one of the most powerful things in Magic.";
  }
  if (typeLine.includes("instant")) {
    return "Instant speed \u2014 you can cast this at any time, even on your opponent's turn.";
  }
  if (typeLine.includes("sorcery")) {
    return "Sorcery \u2014 cast only during your main phase when nothing else is on the stack.";
  }
  if ((card.cmc || 0) <= 1) {
    return "Low cost \u2014 great for early game or chaining multiple spells in one turn.";
  }
  return null;
}

function checkIllegal(card: DeckCard, deckFormat: string): boolean {
  if (!card.legalities) return false;
  try {
    const legalities = JSON.parse(card.legalities);
    const status = legalities[deckFormat];
    return status && status !== "legal" && status !== "restricted";
  } catch {
    return false;
  }
}
