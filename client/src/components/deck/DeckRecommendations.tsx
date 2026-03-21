import { useState, useEffect } from "react";
import { ChevronUp, ChevronDown, Plus, Heart, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { ScryfallCard } from "@shared/schema";

interface RecommendedCard {
  name: string;
  synergy?: number;
  image?: string;
  num_decks?: number;
}

interface CardlistCategory {
  header: string;
  cardviews: Array<{
    name: string;
    synergy?: number;
    image?: string;
    num_decks?: number;
  }>;
}

interface DeckRecommendationsProps {
  commanderName: string | undefined;
  deckFormat: string;
  open: boolean;
  onToggle: () => void;
  onAddCard: (card: ScryfallCard) => void;
  onAddToWishlist: (card: { name: string; image?: string }) => void;
}

function commanderToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/,/g, "")
    .replace(/'/g, "")
    .replace(/\s+/g, "-");
}

export default function DeckRecommendations({
  commanderName,
  deckFormat,
  open,
  onToggle,
  onAddCard,
  onAddToWishlist,
}: DeckRecommendationsProps) {
  const [categories, setCategories] = useState<CardlistCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingCard, setAddingCard] = useState<string | null>(null);
  const { toast } = useToast();

  const isCommander = deckFormat === "commander";

  useEffect(() => {
    if (!open || !commanderName || !isCommander) return;

    const cacheKey = `edhrec_${commanderToSlug(commanderName)}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        setCategories(JSON.parse(cached));
        return;
      } catch {
        // Ignore invalid cache
      }
    }

    const fetchRecs = async () => {
      setLoading(true);
      setError(null);

      const slug = commanderToSlug(commanderName);
      const edhrecUrl = `https://json.edhrec.com/pages/commanders/${slug}.json`;

      let data: any = null;

      // Try direct fetch first
      try {
        const res = await fetch(edhrecUrl);
        if (res.ok) data = await res.json();
      } catch {
        // CORS blocked, try proxy
      }

      // Try CORS proxy if direct failed
      if (!data) {
        try {
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(edhrecUrl)}`;
          const res = await fetch(proxyUrl);
          if (res.ok) data = await res.json();
        } catch {
          // Proxy also failed
        }
      }

      if (!data) {
        setError(commanderName);
        setLoading(false);
        return;
      }

      // Parse EDHREC response
      const cardlists: CardlistCategory[] = [];
      if (data.cardlists) {
        for (const list of data.cardlists) {
          if (list.header && list.cardviews?.length > 0) {
            cardlists.push({
              header: list.header,
              cardviews: list.cardviews.slice(0, 12).map((cv: any) => ({
                name: cv.name,
                synergy: cv.synergy,
                image: cv.image,
                num_decks: cv.num_decks,
              })),
            });
          }
        }
      }

      if (cardlists.length > 0) {
        setCategories(cardlists);
        sessionStorage.setItem(cacheKey, JSON.stringify(cardlists));
      } else {
        setError(commanderName);
      }
      setLoading(false);
    };

    fetchRecs();
  }, [open, commanderName, isCommander]);

  const handleAddCard = async (cardName: string) => {
    setAddingCard(cardName);
    try {
      const res = await fetch(
        `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`
      );
      if (res.ok) {
        const scryfallCard = await res.json();
        onAddCard(scryfallCard);
        toast({ title: `${cardName} added to deck` });
      } else {
        toast({ title: "Card not found on Scryfall", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to fetch card data", variant: "destructive" });
    }
    setAddingCard(null);
  };

  if (!isCommander) return null;

  return (
    <div className="border border-card-border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-3 bg-card hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">🧙</span>
          <span className="text-sm font-semibold">EDHREC Recommendations</span>
          {commanderName && (
            <Badge variant="outline" className="text-[10px]">{commanderName}</Badge>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="p-3 border-t border-card-border space-y-4">
          {!commanderName && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Set a commander in your deck to get recommendations.
            </p>
          )}

          {commanderName && loading && (
            <div className="text-center py-6">
              <Loader2 className="w-6 h-6 mx-auto animate-spin text-primary mb-2" />
              <p className="text-xs text-muted-foreground">Fetching recommendations from EDHREC...</p>
            </div>
          )}

          {commanderName && error && (
            <div className="text-center py-4 space-y-2">
              <AlertCircle className="w-5 h-5 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                EDHREC recommendations unavailable for this commander.
              </p>
              <a
                href={`https://edhrec.com/commanders/${commanderToSlug(error)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                View on EDHREC
              </a>
            </div>
          )}

          {commanderName && !loading && !error && categories.length > 0 && (
            <>
              {categories.map((category) => (
                <div key={category.header}>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 border-b border-primary/20 pb-1">
                    {category.header}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {category.cardviews.map((card) => (
                      <div
                        key={card.name}
                        className="flex items-center gap-2 p-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                      >
                        {card.image ? (
                          <img
                            src={card.image}
                            alt={card.name}
                            className="w-8 h-11 rounded object-cover shrink-0"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-8 h-11 rounded bg-muted shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">{card.name}</div>
                          {card.synergy != null && (
                            <div className={`text-[10px] ${card.synergy > 0 ? "text-emerald-400" : "text-muted-foreground"}`}>
                              {card.synergy > 0 ? "+" : ""}{(card.synergy * 100).toFixed(0)}% synergy
                            </div>
                          )}
                          {card.num_decks != null && (
                            <div className="text-[10px] text-muted-foreground">
                              {card.num_decks.toLocaleString()} decks
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            className="w-6 h-6 rounded bg-primary/20 hover:bg-primary/40 flex items-center justify-center text-primary transition-colors"
                            onClick={() => handleAddCard(card.name)}
                            disabled={addingCard === card.name}
                            title="Add to deck"
                          >
                            {addingCard === card.name ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Plus className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            className="w-6 h-6 rounded bg-pink-500/20 hover:bg-pink-500/40 flex items-center justify-center text-pink-400 transition-colors"
                            onClick={() => onAddToWishlist({ name: card.name, image: card.image })}
                            title="Add to wishlist"
                          >
                            <Heart className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="text-center pt-2 border-t border-card-border">
                <a
                  href={`https://edhrec.com/commanders/${commanderToSlug(commanderName)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
                >
                  Powered by EDHREC
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
