import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Minus, Plus, Trash2, DollarSign, BookOpen } from "lucide-react";
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
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-card-border rounded-xl p-3 text-center">
          <div className="text-xl font-bold">{totalCards}</div>
          <div className="text-xs text-muted-foreground">Total Cards</div>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-3 text-center">
          <div className="text-xl font-bold">{uniqueCards}</div>
          <div className="text-xs text-muted-foreground">Unique</div>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-emerald-500">
            ${totalValue.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground">Est. Value</div>
        </div>
      </div>

      {/* Search + filters */}
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
              className="flex items-center gap-3 bg-card border border-card-border rounded-xl p-2.5 hover:border-primary/30 transition-colors"
              data-testid={`collection-card-${card.id}`}
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
                    <span className="text-xs text-emerald-500 font-medium">
                      ${card.priceUsd}
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
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
          <div className="text-4xl mb-4">📚</div>
          <h2 className="text-lg font-semibold mb-1">No Cards Yet</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Search for cards and add them to your collection to track quantities
            and estimated value.
          </p>
        </div>
      )}

      {!isLoading && cards.length > 0 && filtered.length === 0 && (
        <div className="text-center py-8">
          <div className="text-2xl mb-2">🔍</div>
          <p className="text-sm text-muted-foreground">
            No cards match your filters
          </p>
        </div>
      )}
    </div>
  );
}
