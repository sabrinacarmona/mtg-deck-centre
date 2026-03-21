import type { ScryfallCard } from "@shared/schema";
import { Plus, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";

function getCardImage(card: ScryfallCard, size: "small" | "normal" = "small"): string | null {
  if (card.image_uris) return card.image_uris[size];
  if (card.card_faces?.[0]?.image_uris) return card.card_faces[0].image_uris[size];
  return null;
}

interface CardGridProps {
  cards: ScryfallCard[];
  onAddToCollection?: (card: ScryfallCard) => void;
  onAddToDeck?: (card: ScryfallCard) => void;
  onCardClick?: (card: ScryfallCard) => void;
  isLoading?: boolean;
  addedIds?: Set<string>;
}

export default function CardGrid({
  cards,
  onAddToCollection,
  onAddToDeck,
  onCardClick,
  isLoading,
  addedIds,
}: CardGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-muted animate-pulse"
            style={{ aspectRatio: "488/680" }}
          />
        ))}
      </div>
    );
  }

  if (cards.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {cards.map((card) => (
        <CardItem
          key={card.id}
          card={card}
          onAddToCollection={onAddToCollection}
          onAddToDeck={onAddToDeck}
          onCardClick={onCardClick}
          wasAdded={addedIds?.has(card.id)}
        />
      ))}
    </div>
  );
}

function CardItem({
  card,
  onAddToCollection,
  onAddToDeck,
  onCardClick,
  wasAdded,
}: {
  card: ScryfallCard;
  onAddToCollection?: (card: ScryfallCard) => void;
  onAddToDeck?: (card: ScryfallCard) => void;
  onCardClick?: (card: ScryfallCard) => void;
  wasAdded?: boolean;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const image = getCardImage(card);

  return (
    <div
      className="group relative rounded-xl overflow-hidden card-hover cursor-pointer"
      onClick={() => onCardClick?.(card)}
      data-testid={`card-item-${card.id}`}
    >
      {/* Card image */}
      <div className="relative" style={{ aspectRatio: "488/680" }}>
        {!imgLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse rounded-xl" />
        )}
        {image ? (
          <img
            src={image}
            alt={card.name}
            className={`w-full h-full object-cover rounded-xl transition-opacity duration-300 ${
              imgLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setImgLoaded(true)}
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-muted flex items-center justify-center rounded-xl">
            <span className="text-xs text-muted-foreground text-center px-2">
              {card.name}
            </span>
          </div>
        )}
      </div>

      {/* Hover overlay with actions */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl flex flex-col justify-end p-2 gap-1.5">
        <div className="text-white text-xs font-semibold leading-tight line-clamp-2">
          {card.name}
        </div>
        {card.prices?.usd && (
          <div className="text-emerald-400 text-xs font-medium">
            ${card.prices.usd}
          </div>
        )}
        <div className="flex gap-1.5 mt-1">
          {onAddToCollection && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={wasAdded ? "secondary" : "default"}
                  className="h-7 text-xs flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCollection(card);
                  }}
                  data-testid={`add-collection-${card.id}`}
                >
                  {wasAdded ? (
                    <>
                      <BookOpen className="w-3 h-3 mr-1" /> Added
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3 mr-1" /> Collection
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add to collection</TooltipContent>
            </Tooltip>
          )}
          {onAddToDeck && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 text-xs flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToDeck(card);
                  }}
                  data-testid={`add-deck-${card.id}`}
                >
                  <Layers3 className="w-3 h-3 mr-1" /> Deck
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add to deck</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}

// Re-export for use elsewhere
import { Layers3 } from "lucide-react";
