import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ManaCurve from "@/components/ManaCurve";
import ColorDistribution from "@/components/ColorDistribution";
import { GitCompare, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import type { Deck, DeckCard } from "@shared/schema";

export default function ComparePage() {
  const [deckAId, setDeckAId] = useState<string>("");
  const [deckBId, setDeckBId] = useState<string>("");

  const { data: decks = [] } = useQuery<Deck[]>({
    queryKey: ["/api/decks"],
  });

  const { data: cardsA = [] } = useQuery<DeckCard[]>({
    queryKey: ["/api/decks", Number(deckAId), "cards"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/decks/${deckAId}/cards`);
      return res.json();
    },
    enabled: !!deckAId,
  });

  const { data: cardsB = [] } = useQuery<DeckCard[]>({
    queryKey: ["/api/decks", Number(deckBId), "cards"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/decks/${deckBId}/cards`);
      return res.json();
    },
    enabled: !!deckBId,
  });

  const deckA = decks.find((d) => String(d.id) === deckAId);
  const deckB = decks.find((d) => String(d.id) === deckBId);

  const mainA = cardsA.filter((c) => c.board === "main");
  const mainB = cardsB.filter((c) => c.board === "main");

  const totalA = mainA.reduce((s, c) => s + (c.quantity || 1), 0);
  const totalB = mainB.reduce((s, c) => s + (c.quantity || 1), 0);

  const avgCmcA = totalA > 0
    ? (mainA.reduce((s, c) => s + (c.cmc || 0) * (c.quantity || 1), 0) / totalA).toFixed(1)
    : "0.0";
  const avgCmcB = totalB > 0
    ? (mainB.reduce((s, c) => s + (c.cmc || 0) * (c.quantity || 1), 0) / totalB).toFixed(1)
    : "0.0";

  const priceA = mainA.reduce((s, c) => s + parseFloat(c.priceUsd || "0") * (c.quantity || 1), 0);
  const priceB = mainB.reduce((s, c) => s + parseFloat(c.priceUsd || "0") * (c.quantity || 1), 0);

  // Shared vs unique cards
  const namesAArr = mainA.map((c) => c.name);
  const namesBArr = mainB.map((c) => c.name);
  const namesASet = new Set(namesAArr);
  const namesBSet = new Set(namesBArr);
  const shared = Array.from(namesASet).filter((n) => namesBSet.has(n));
  const uniqueA = Array.from(namesASet).filter((n) => !namesBSet.has(n));
  const uniqueB = Array.from(namesBSet).filter((n) => !namesASet.has(n));

  const ready = deckAId && deckBId && deckAId !== deckBId;

  return (
    <div className="space-y-4" data-testid="compare-page">
      <div className="flex items-center gap-3">
        <Link href="/decks">
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <GitCompare className="w-5 h-5" />
          Compare Decks
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select value={deckAId} onValueChange={setDeckAId}>
          <SelectTrigger>
            <SelectValue placeholder="Select deck A" />
          </SelectTrigger>
          <SelectContent>
            {decks.map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={deckBId} onValueChange={setDeckBId}>
          <SelectTrigger>
            <SelectValue placeholder="Select deck B" />
          </SelectTrigger>
          <SelectContent>
            {decks.map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {ready && (
        <>
          {/* Stats comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-card-border rounded-xl p-3 space-y-2">
              <h3 className="text-sm font-semibold truncate">{deckA?.name}</h3>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Cards: <span className="font-medium text-foreground">{totalA}</span></div>
                <div>Avg CMC: <span className="font-medium text-foreground">{avgCmcA}</span></div>
                <div>Est. Value: <span className="font-medium text-emerald-500">${priceA.toFixed(2)}</span></div>
              </div>
            </div>
            <div className="bg-card border border-card-border rounded-xl p-3 space-y-2">
              <h3 className="text-sm font-semibold truncate">{deckB?.name}</h3>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Cards: <span className="font-medium text-foreground">{totalB}</span></div>
                <div>Avg CMC: <span className="font-medium text-foreground">{avgCmcB}</span></div>
                <div>Est. Value: <span className="font-medium text-emerald-500">${priceB.toFixed(2)}</span></div>
              </div>
            </div>
          </div>

          {/* Mana curves */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-card-border rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-semibold">Mana Curve — {deckA?.name}</h3>
              <ManaCurve cards={mainA} />
            </div>
            <div className="bg-card border border-card-border rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-semibold">Mana Curve — {deckB?.name}</h3>
              <ManaCurve cards={mainB} />
            </div>
          </div>

          {/* Color distribution */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-card-border rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-semibold">Colors — {deckA?.name}</h3>
              <ColorDistribution cards={mainA} />
            </div>
            <div className="bg-card border border-card-border rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-semibold">Colors — {deckB?.name}</h3>
              <ColorDistribution cards={mainB} />
            </div>
          </div>

          {/* Shared vs unique */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-card border border-card-border rounded-xl p-3">
              <h3 className="text-xs font-semibold mb-2">
                Shared Cards ({shared.length})
              </h3>
              <div className="space-y-0.5 max-h-48 overflow-y-auto">
                {shared.map((name) => (
                  <div key={name} className="text-xs text-muted-foreground">{name}</div>
                ))}
                {shared.length === 0 && (
                  <div className="text-xs text-muted-foreground">No shared cards</div>
                )}
              </div>
            </div>
            <div className="bg-card border border-card-border rounded-xl p-3">
              <h3 className="text-xs font-semibold mb-2">
                Only in {deckA?.name} ({uniqueA.length})
              </h3>
              <div className="space-y-0.5 max-h-48 overflow-y-auto">
                {uniqueA.map((name) => (
                  <div key={name} className="text-xs text-muted-foreground">{name}</div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-card-border rounded-xl p-3">
              <h3 className="text-xs font-semibold mb-2">
                Only in {deckB?.name} ({uniqueB.length})
              </h3>
              <div className="space-y-0.5 max-h-48 overflow-y-auto">
                {uniqueB.map((name) => (
                  <div key={name} className="text-xs text-muted-foreground">{name}</div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {!ready && (
        <div className="text-center py-12 text-sm text-muted-foreground">
          <GitCompare className="w-8 h-8 mx-auto mb-3 opacity-30" />
          Select two different decks to compare
        </div>
      )}
    </div>
  );
}
