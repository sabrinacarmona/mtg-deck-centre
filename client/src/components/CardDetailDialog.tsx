import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ScryfallCard, Deck } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Heart, Layers3 } from "lucide-react";
import { ManaCost, OracleText } from "@/components/ManaSymbols";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function getCardImage(card: ScryfallCard): string | null {
  if (card.image_uris) return card.image_uris.normal;
  if (card.card_faces?.[0]?.image_uris) return card.card_faces[0].image_uris.normal;
  return null;
}

function getCardSmallImage(card: ScryfallCard): string | null {
  if (card.image_uris) return card.image_uris.small;
  if (card.card_faces?.[0]?.image_uris) return card.card_faces[0].image_uris.small;
  return null;
}

const colorMap: Record<string, string> = {
  W: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300",
  U: "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300",
  B: "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-300",
  R: "bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-300",
  G: "bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-300",
};

const colorNames: Record<string, string> = {
  W: "White",
  U: "Blue",
  B: "Black",
  R: "Red",
  G: "Green",
};

interface CardDetailDialogProps {
  card: ScryfallCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCollection?: (card: ScryfallCard) => void;
  onToggleWishlist?: (card: ScryfallCard) => void;
  isWishlisted?: boolean;
  decks?: Deck[];
  onAddToDeck?: (card: ScryfallCard, deckId: number) => void;
}

export default function CardDetailDialog({
  card,
  open,
  onOpenChange,
  onAddToCollection,
  onToggleWishlist,
  isWishlisted,
  decks,
  onAddToDeck,
}: CardDetailDialogProps) {
  const [activeCard, setActiveCard] = useState<ScryfallCard | null>(null);

  // Reset active card when the dialog card changes
  useEffect(() => {
    setActiveCard(null);
  }, [card?.id]);

  const displayCard = activeCard || card;

  // Fetch printings when modal opens
  const { data: printings = [] } = useQuery<ScryfallCard[]>({
    queryKey: ["printings", card?.name],
    queryFn: async () => {
      if (!card) return [];
      // Use prints_search_uri if available, otherwise build query
      const url = card.prints_search_uri
        ? card.prints_search_uri
        : `https://api.scryfall.com/cards/search?q=!"${encodeURIComponent(card.name)}"+unique:prints&order=released`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.data || []) as ScryfallCard[];
    },
    enabled: open && !!card,
  });

  if (!displayCard) return null;
  const image = getCardImage(displayCard);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">{displayCard.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card image */}
          <div className="flex justify-center">
            {image ? (
              <img
                src={image}
                alt={displayCard.name}
                className="rounded-xl w-full max-w-[300px]"
                data-testid="card-detail-image"
              />
            ) : (
              <div className="bg-muted rounded-xl w-full max-w-[300px] flex items-center justify-center" style={{ aspectRatio: "488/680" }}>
                <span className="text-muted-foreground">{displayCard.name}</span>
              </div>
            )}
          </div>

          {/* Card info */}
          <div className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Type
              </div>
              <div className="text-sm font-medium">{displayCard.type_line}</div>
            </div>

            {displayCard.mana_cost && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Mana Cost
                </div>
                <div className="text-sm font-medium">
                  <ManaCost cost={displayCard.mana_cost} size="md" />
                </div>
              </div>
            )}

            {displayCard.oracle_text && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Oracle Text
                </div>
                <div className="text-sm leading-relaxed">
                  {displayCard.oracle_text.split("\n").map((line, i) => (
                    <span key={i}>
                      {i > 0 && <br />}
                      <OracleText text={line} size="sm" />
                    </span>
                  ))}
                </div>
              </div>
            )}

            {displayCard.power && displayCard.toughness && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  P/T
                </div>
                <div className="text-sm font-medium">
                  {displayCard.power}/{displayCard.toughness}
                </div>
              </div>
            )}

            {displayCard.colors && displayCard.colors.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Colors
                </div>
                <div className="flex gap-1">
                  {displayCard.colors.map((c) => (
                    <Badge key={c} variant="secondary" className={colorMap[c] || ""}>
                      {colorNames[c] || c}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {displayCard.rarity && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Rarity
                </div>
                <Badge variant="outline" className="capitalize">
                  {displayCard.rarity}
                </Badge>
              </div>
            )}

            {displayCard.set_name && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Set
                </div>
                <div className="text-sm">{displayCard.set_name}</div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {displayCard.prices?.usd && (
                <div className="text-lg font-bold text-emerald-500">
                  ${displayCard.prices.usd}
                </div>
              )}
              {displayCard.prices?.usd_foil && (
                <div className="text-sm text-muted-foreground self-end mb-0.5">
                  Foil: ${displayCard.prices.usd_foil}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap">
              {onAddToCollection && (
                <Button
                  className="flex-1"
                  onClick={() => {
                    onAddToCollection(displayCard);
                    onOpenChange(false);
                  }}
                  data-testid="detail-add-collection"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Collection
                </Button>
              )}
              {onAddToDeck && decks && decks.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="secondary" className="gap-1.5">
                      <Layers3 className="w-4 h-4" />
                      Add to Deck
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-52 p-1">
                    {decks.map((deck) => (
                      <button
                        key={deck.id}
                        className="w-full text-left px-2.5 py-1.5 text-sm rounded hover:bg-muted transition-colors"
                        onClick={() => {
                          onAddToDeck(displayCard, deck.id);
                          onOpenChange(false);
                        }}
                      >
                        {deck.name}
                        <span className="text-muted-foreground ml-1 capitalize text-xs">({deck.format})</span>
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
              )}
              {onToggleWishlist && (
                <Button
                  variant={isWishlisted ? "default" : "secondary"}
                  className={isWishlisted ? "bg-red-500 hover:bg-red-600 text-white" : ""}
                  onClick={() => onToggleWishlist(displayCard)}
                  data-testid="detail-toggle-wishlist"
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? "fill-current" : ""}`} />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Other Printings */}
        {printings.length > 1 && (
          <div className="mt-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
              Other Printings ({printings.length})
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {printings.map((p) => {
                const thumb = getCardSmallImage(p);
                const isActive = displayCard.id === p.id;
                return (
                  <button
                    key={p.id}
                    className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                      isActive ? "border-primary" : "border-transparent hover:border-border"
                    }`}
                    onClick={() => setActiveCard(p)}
                    title={`${p.set_name || p.set} — ${p.prices?.usd ? `$${p.prices.usd}` : "N/A"}`}
                  >
                    <div className="w-16 relative">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={`${p.name} (${p.set_name})`}
                          className="w-full rounded-md"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full bg-muted rounded-md" style={{ aspectRatio: "488/680" }} />
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-[8px] text-white text-center py-0.5 leading-tight">
                        <div className="uppercase font-medium truncate px-0.5">{p.set || "?"}</div>
                        {p.prices?.usd && <div className="text-primary">${p.prices.usd}</div>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
