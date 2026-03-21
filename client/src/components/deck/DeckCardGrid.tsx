import { useState } from "react";
import { Crown } from "lucide-react";
import type { DeckCard } from "@shared/schema";

interface DeckCardGridProps {
  cards: DeckCard[];
  onUpdateQuantity: (id: number, qty: number) => void;
  onRemove: (id: number) => void;
  onCardClick: (card: DeckCard) => void;
  deckFormat: string;
}

export default function DeckCardGrid({
  cards,
  onUpdateQuantity,
  onRemove,
  onCardClick,
  deckFormat,
}: DeckCardGridProps) {
  const grouped: Record<string, DeckCard[]> = {};
  for (const card of cards) {
    const rawType = card.typeLine.split("—")[0].trim();
    let type = "Other";
    if (rawType.includes("Creature")) type = "Creatures";
    else if (rawType.includes("Instant")) type = "Instants";
    else if (rawType.includes("Sorcery")) type = "Sorceries";
    else if (rawType.includes("Enchantment")) type = "Enchantments";
    else if (rawType.includes("Artifact")) type = "Artifacts";
    else if (rawType.includes("Planeswalker")) type = "Planeswalkers";
    else if (rawType.includes("Land")) type = "Lands";
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(card);
  }

  const typeOrder = [
    "Creatures",
    "Planeswalkers",
    "Instants",
    "Sorceries",
    "Enchantments",
    "Artifacts",
    "Lands",
    "Other",
  ];

  const sortedGroups = typeOrder
    .filter((t) => grouped[t]?.length > 0)
    .map((t) => ({ type: t, cards: grouped[t] }));

  return (
    <div className="space-y-5">
      {sortedGroups.map(({ type, cards: typeCards }) => (
        <div key={type}>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 border-b border-primary/20 pb-1">
            {type} ({typeCards.reduce((s, c) => s + (c.quantity || 1), 0)})
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {typeCards.map((card) => (
              <DeckCardTile
                key={card.id}
                card={card}
                onCardClick={onCardClick}
                deckFormat={deckFormat}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DeckCardTile({
  card,
  onCardClick,
  deckFormat,
}: {
  card: DeckCard;
  onCardClick: (card: DeckCard) => void;
  deckFormat: string;
}) {
  const isIllegal = checkIllegal(card, deckFormat);

  return (
    <div
      className="relative group cursor-pointer"
      data-testid={`deck-card-${card.id}`}
      onClick={() => onCardClick(card)}
    >
      {card.imageSmall || card.imageNormal ? (
        <img
          src={card.imageNormal || card.imageSmall || ""}
          alt={card.name}
          className="w-full rounded-lg card-hover"
          loading="lazy"
        />
      ) : (
        <div className="w-full aspect-[5/7] rounded-lg bg-muted flex items-center justify-center">
          <span className="text-[10px] text-muted-foreground text-center px-1">
            {card.name}
          </span>
        </div>
      )}

      {(card.quantity || 1) > 1 && (
        <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
          {card.quantity}
        </div>
      )}

      {card.isCommander && (
        <div className="absolute top-1 right-1 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
          <Crown className="w-3 h-3" />
        </div>
      )}

      {isIllegal && (
        <div className="absolute bottom-1 right-1 bg-red-500/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
          !
        </div>
      )}

      <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
        <div className="w-full bg-gradient-to-t from-black/80 to-transparent rounded-b-lg px-2 py-1.5">
          <span className="text-[10px] text-white font-medium leading-tight line-clamp-2">
            {card.name}
          </span>
        </div>
      </div>
    </div>
  );
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
