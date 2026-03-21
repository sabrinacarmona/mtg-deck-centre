import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Minus, Plus, Trash2, DollarSign, BookOpen, Import, X } from "lucide-react";
import ImportDialog from "@/components/ImportDialog";
import type { CollectionCard } from "@shared/schema";

const colorFilters = [
  { key: "all", label: "All" },
  { key: "W", label: "White", color: "#f0e6b6" },
  { key: "U", label: "Blue", color: "#0e68ab" },
  { key: "B", label: "Black", color: "#555555" },
  { key: "R", label: "Red", color: "#d3202a" },
  { key: "G", label: "Green", color: "#00733e" },
];

export default function CollectionPage() {
  const [search, setSearch] = useState("");
  const [colorFilter, setColorFilter] = useState("all");
  const [importOpen, setImportOpen] = useState(false);
  const [zoomedCard, setZoomedCard] = useState<CollectionCard | null>(null);
  const { toast } = useToast();

  const { data: cards = [], isLoading } = useQuery<CollectionCard[]>({
    queryKey: ["/api/collection"],
  });

  const updateQuantity = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      if (quantity <= 0) {
        await apiRequest("DELETE", `/api/collection/${id}`);
        return null;
      }
      const res = await apiRequest("PATCH", `/api/collection/${id}/quantity`, { quantity });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collection"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const removeCard = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/collection/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collection"] });
      toast({ title: "Card removed from collection" });
    },
  });

  // Filter cards
  const filtered = cards.filter((card) => {
    const matchesSearch =
      !search ||
      card.name.toLowerCase().includes(search.toLowerCase()) ||
      card.typeLine.toLowerCase().includes(search.toLowerCase());

    const matchesColor =
      colorFilter === "all" ||
      (card.colors && JSON.parse(card.colors).includes(colorFilter));

    return matchesSearch && matchesColor;
  });

  // Stats
  const totalCards = cards.reduce((sum, c) => sum + (c.quantity || 1), 0);
  const uniqueCards = cards.length;
  const totalValue = cards.reduce((sum, c) => {
    const price = parseFloat(c.priceUsd || "0");
    return sum + price * (c.quantity || 1);
  }, 0);

  return (
    <div className="space-y-4" data-testid="collection-page">
      {/* Stats bar — card-frame style */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card-frame p-3 text-center">
          <div className="text-xl font-bold">{totalCards}</div>
          <div className="text-xs text-muted-foreground">Total Cards</div>
        </div>
        <div className="card-frame p-3 text-center">
          <div className="text-xl font-bold">{uniqueCards}</div>
          <div className="text-xs text-muted-foreground">Unique</div>
        </div>
        <div className="card-frame p-3 text-center">
          <div className="text-xl font-bold text-primary">
            ${totalValue.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground">Est. Value</div>
        </div>
      </div>

      {/* Search + filters + import */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Filter your collection..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-card border-border"
            data-testid="collection-search"
          />
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={() => setImportOpen(true)}
          data-testid="import-collection-btn"
        >
          <Import className="w-3.5 h-3.5" />
          Import
        </Button>
        <div className="flex gap-1 flex-wrap">
          {colorFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setColorFilter(f.key)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                colorFilter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`color-filter-${f.key}`}
            >
              {f.color && (
                <span
                  className="inline-block w-2 h-2 rounded-full mr-1"
                  style={{ backgroundColor: f.color }}
                />
              )}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      )}

      {/* Card list */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-1.5">
          {filtered.map((card) => (
            <div
              key={card.id}
              className="flex items-center gap-3 bg-card border border-card-border rounded-xl p-2.5 hover:border-primary/30 transition-colors cursor-pointer"
              data-testid={`collection-card-${card.id}`}
              onClick={() => setZoomedCard(card)}
            >
              {/* Thumbnail */}
              {card.imageSmall ? (
                <img
                  src={card.imageSmall}
                  alt={card.name}
                  className="w-10 h-14 rounded object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-14 rounded bg-muted flex-shrink-0" />
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{card.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {card.typeLine}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {card.rarity && (
                    <Badge variant="outline" className="text-[10px] h-4 capitalize">
                      {card.rarity}
                    </Badge>
                  )}
                  {card.priceUsd && (
                    <span className="text-xs text-primary font-medium">
                      ${card.priceUsd}
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="secondary"
                  size="icon"
                  className="w-7 h-7"
                  onClick={() =>
                    updateQuantity.mutate({
                      id: card.id,
                      quantity: (card.quantity || 1) - 1,
                    })
                  }
                  data-testid={`qty-minus-${card.id}`}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="text-sm font-semibold w-6 text-center" data-testid={`qty-${card.id}`}>
                  {card.quantity || 1}
                </span>
                <Button
                  variant="secondary"
                  size="icon"
                  className="w-7 h-7"
                  onClick={() =>
                    updateQuantity.mutate({
                      id: card.id,
                      quantity: (card.quantity || 1) + 1,
                    })
                  }
                  data-testid={`qty-plus-${card.id}`}
                >
                  <Plus className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 text-destructive hover:text-destructive"
                  onClick={() => removeCard.mutate(card.id)}
                  data-testid={`remove-${card.id}`}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && cards.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/15 flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold mb-1">No Cards Yet</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Search for cards and add them to your collection to track quantities
            and estimated value.
          </p>
        </div>
      )}

      {!isLoading && cards.length > 0 && filtered.length === 0 && (
        <div className="text-center py-8">
          <Search className="w-8 h-8 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            No cards match your filters
          </p>
        </div>
      )}

      {/* Import dialog */}
      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
      />

      {/* Collection card zoom overlay */}
      {zoomedCard && (
        <CollectionCardZoom
          card={zoomedCard}
          onClose={() => setZoomedCard(null)}
          onUpdateQuantity={(id, qty) => {
            updateQuantity.mutate({ id, quantity: qty });
            if (qty <= 0) setZoomedCard(null);
          }}
          onRemove={(id) => {
            removeCard.mutate(id);
            setZoomedCard(null);
          }}
        />
      )}
    </div>
  );
}

function CollectionCardZoom({
  card,
  onClose,
  onUpdateQuantity,
  onRemove,
}: {
  card: CollectionCard;
  onClose: () => void;
  onUpdateQuantity: (id: number, qty: number) => void;
  onRemove: (id: number) => void;
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

        <div className="flex flex-col items-center sm:items-start gap-4 text-white">
          <div>
            <h2 className="text-xl font-bold">{card.name}</h2>
            <p className="text-sm text-white/60">{card.typeLine}</p>
            {card.manaCost && (
              <p className="text-sm text-white/50 mt-1">{card.manaCost}</p>
            )}
          </div>

          {card.oracleText && (
            <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed max-w-xs">
              {card.oracleText}
            </p>
          )}

          {card.power && card.toughness && (
            <p className="text-sm font-semibold text-white/70">
              {card.power}/{card.toughness}
            </p>
          )}

          {card.priceUsd && (
            <p className="text-lg font-bold text-amber-400">
              ${card.priceUsd}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2">
            <button
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              onClick={() => onUpdateQuantity(card.id, (card.quantity || 1) - 1)}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-lg font-bold w-8 text-center">
              {card.quantity || 1}x
            </span>
            <button
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              onClick={() => onUpdateQuantity(card.id, (card.quantity || 1) + 1)}
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              className="w-8 h-8 rounded-lg bg-red-500/30 hover:bg-red-500/50 flex items-center justify-center text-white transition-colors ml-2"
              onClick={() => onRemove(card.id)}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
