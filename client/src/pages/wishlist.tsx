import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Heart, Trash2, X } from "lucide-react";
import { useState, useEffect } from "react";

interface WishlistCard {
  id: number;
  scryfallId: string;
  name: string;
  imageSmall: string | null;
  imageNormal: string | null;
  priceUsd: string | null;
  typeLine: string;
  addedDate: string;
}

export default function WishlistPage() {
  const { toast } = useToast();
  const [zoomedCard, setZoomedCard] = useState<WishlistCard | null>(null);

  const { data: cards = [], isLoading } = useQuery<WishlistCard[]>({
    queryKey: ["/api/wishlist"],
  });

  const removeCard = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/wishlist/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({ title: "Removed from wishlist" });
    },
  });

  const addToCollection = useMutation({
    mutationFn: async (card: WishlistCard) => {
      const res = await apiRequest("POST", "/api/collection", {
        scryfallId: card.scryfallId,
        name: card.name,
        typeLine: card.typeLine,
        manaCost: null,
        cmc: 0,
        imageSmall: card.imageSmall,
        imageNormal: card.imageNormal,
        priceUsd: card.priceUsd,
        colors: JSON.stringify([]),
        colorIdentity: JSON.stringify([]),
        rarity: null,
        setName: null,
        setCode: null,
        oracleText: null,
        power: null,
        toughness: null,
        quantity: 1,
      });
      return res.json();
    },
    onSuccess: (_data, card) => {
      queryClient.invalidateQueries({ queryKey: ["/api/collection"] });
      toast({ title: `${card.name} added to collection` });
    },
  });

  const totalValue = cards.reduce((sum, c) => sum + parseFloat(c.priceUsd || "0"), 0);

  return (
    <div className="space-y-4" data-testid="wishlist-page">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Heart className="w-5 h-5 text-primary" />
          Wishlist
        </h1>
        {cards.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {cards.length} cards &middot;{" "}
            <span className="text-primary font-medium">${totalValue.toFixed(2)}</span>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl bg-muted animate-pulse"
              style={{ aspectRatio: "488/680" }}
            />
          ))}
        </div>
      )}

      {!isLoading && cards.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {cards.map((card) => (
            <div
              key={card.id}
              className="group relative rounded-xl overflow-hidden card-hover cursor-pointer"
              onClick={() => setZoomedCard(card)}
            >
              <div className="relative" style={{ aspectRatio: "488/680" }}>
                {card.imageSmall ? (
                  <img
                    src={card.imageSmall}
                    alt={card.name}
                    className="w-full h-full object-cover rounded-xl"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center rounded-xl">
                    <span className="text-xs text-muted-foreground">{card.name}</span>
                  </div>
                )}
              </div>

              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl flex flex-col justify-end p-2 gap-1">
                <div className="text-white text-xs font-semibold line-clamp-2">
                  {card.name}
                </div>
                {card.priceUsd && (
                  <div className="text-amber-400 text-xs">${card.priceUsd}</div>
                )}
                <div className="flex gap-1 mt-1">
                  <Button
                    size="sm"
                    className="h-7 text-xs flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCollection.mutate(card);
                    }}
                  >
                    + Collection
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-red-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCard.mutate(card.id);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && cards.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/15 flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold mb-1">No Wishlist Cards</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Tap the heart icon on any card in search results to add it to your
            wishlist.
          </p>
        </div>
      )}

      {zoomedCard && (
        <WishlistZoom
          card={zoomedCard}
          onClose={() => setZoomedCard(null)}
          onRemove={(id) => {
            removeCard.mutate(id);
            setZoomedCard(null);
          }}
          onAddToCollection={(card) => {
            addToCollection.mutate(card);
          }}
        />
      )}
    </div>
  );
}

function WishlistZoom({
  card,
  onClose,
  onRemove,
  onAddToCollection,
}: {
  card: WishlistCard;
  onClose: () => void;
  onRemove: (id: number) => void;
  onAddToCollection: (card: WishlistCard) => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const image = card.imageNormal || card.imageSmall;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col sm:flex-row items-center gap-6 max-w-3xl w-full px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute -top-2 -right-2 sm:top-0 sm:right-0 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </button>

        {image ? (
          <img
            src={image}
            alt={card.name}
            className="rounded-2xl shadow-2xl max-h-[75vh] w-auto"
          />
        ) : (
          <div className="bg-muted rounded-2xl w-[300px] aspect-[5/7] flex items-center justify-center">
            <span className="text-muted-foreground">{card.name}</span>
          </div>
        )}

        <div className="flex flex-col items-center sm:items-start gap-3 text-white">
          <h2 className="text-xl font-bold">{card.name}</h2>
          <p className="text-sm text-white/60">{card.typeLine}</p>
          {card.priceUsd && (
            <p className="text-lg font-bold text-amber-400">${card.priceUsd}</p>
          )}
          <p className="text-xs text-white/40">Added: {card.addedDate}</p>
          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              onClick={() => onAddToCollection(card)}
            >
              Add to Collection
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onRemove(card.id)}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Remove
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
