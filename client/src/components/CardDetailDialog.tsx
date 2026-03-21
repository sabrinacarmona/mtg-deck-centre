import type { ScryfallCard } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

function getCardImage(card: ScryfallCard): string | null {
  if (card.image_uris) return card.image_uris.normal;
  if (card.card_faces?.[0]?.image_uris) return card.card_faces[0].image_uris.normal;
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
}

export default function CardDetailDialog({
  card,
  open,
  onOpenChange,
  onAddToCollection,
}: CardDetailDialogProps) {
  if (!card) return null;
  const image = getCardImage(card);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">{card.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card image */}
          <div className="flex justify-center">
            {image ? (
              <img
                src={image}
                alt={card.name}
                className="rounded-xl w-full max-w-[300px]"
                data-testid="card-detail-image"
              />
            ) : (
              <div className="bg-muted rounded-xl w-full max-w-[300px] flex items-center justify-center" style={{ aspectRatio: "488/680" }}>
                <span className="text-muted-foreground">{card.name}</span>
              </div>
            )}
          </div>

          {/* Card info */}
          <div className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Type
              </div>
              <div className="text-sm font-medium">{card.type_line}</div>
            </div>

            {card.mana_cost && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Mana Cost
                </div>
                <div className="text-sm font-medium">{card.mana_cost}</div>
              </div>
            )}

            {card.oracle_text && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Oracle Text
                </div>
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {card.oracle_text}
                </div>
              </div>
            )}

            {card.power && card.toughness && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  P/T
                </div>
                <div className="text-sm font-medium">
                  {card.power}/{card.toughness}
                </div>
              </div>
            )}

            {card.colors && card.colors.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Colors
                </div>
                <div className="flex gap-1">
                  {card.colors.map((c) => (
                    <Badge key={c} variant="secondary" className={colorMap[c] || ""}>
                      {colorNames[c] || c}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {card.rarity && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Rarity
                </div>
                <Badge variant="outline" className="capitalize">
                  {card.rarity}
                </Badge>
              </div>
            )}

            {card.set_name && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Set
                </div>
                <div className="text-sm">{card.set_name}</div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {card.prices?.usd && (
                <div className="text-lg font-bold text-emerald-500">
                  ${card.prices.usd}
                </div>
              )}
              {card.prices?.usd_foil && (
                <div className="text-sm text-muted-foreground self-end mb-0.5">
                  Foil: ${card.prices.usd_foil}
                </div>
              )}
            </div>

            {onAddToCollection && (
              <Button
                className="w-full"
                onClick={() => {
                  onAddToCollection(card);
                  onOpenChange(false);
                }}
                data-testid="detail-add-collection"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add to Collection
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
