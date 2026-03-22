import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ManaCost } from "@/components/ManaSymbols";
import {
  Crown,
  Wand2,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Check,
  Minus,
  Plus,
  Trash2,
  Save,
  Sparkles,
} from "lucide-react";
import type { CollectionCard, ScryfallCard } from "@shared/schema";

interface DeckBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CommanderCandidate {
  card: CollectionCard;
  colorIdentity: string[];
  matchingCards: number;
  totalCards: number;
  strategy: string;
}

interface DeckSlot {
  card: CollectionCard;
  quantity: number;
  isCommander?: boolean;
}

// Color symbols for display
const COLOR_SYMBOLS: Record<string, { label: string; bg: string }> = {
  W: { label: "W", bg: "bg-amber-100 text-amber-900" },
  U: { label: "U", bg: "bg-blue-500 text-white" },
  B: { label: "B", bg: "bg-gray-700 text-white" },
  R: { label: "R", bg: "bg-red-600 text-white" },
  G: { label: "G", bg: "bg-green-600 text-white" },
};

// Basic land names per color
const BASIC_LANDS: Record<string, string> = {
  W: "Plains",
  U: "Island",
  B: "Swamp",
  R: "Mountain",
  G: "Forest",
};

function parseColors(jsonStr: string | null): string[] {
  if (!jsonStr) return [];
  try {
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getStrategy(card: CollectionCard): string {
  const text = (card.oracleText || "").toLowerCase();
  const typeLine = (card.typeLine || "").toLowerCase();

  if (text.includes("create") && text.includes("token")) return "Token generation";
  if (text.includes("+1/+1 counter")) return "+1/+1 counters theme";
  if (text.includes("graveyard") || text.includes("from your graveyard")) return "Graveyard recursion";
  if (text.includes("draw") && text.includes("card")) return "Card advantage";
  if (text.includes("destroy") || text.includes("exile")) return "Removal/Control";
  if (text.includes("whenever") && text.includes("enters")) return "ETB triggers";
  if (text.includes("sacrifice")) return "Sacrifice theme";
  if (typeLine.includes("eldrazi")) return "Eldrazi tribal";
  if (text.includes("energy")) return "Energy synergies";
  if (text.includes("artifact")) return "Artifact synergies";
  if (text.includes("enchant")) return "Enchantment synergies";
  return "Goodstuff / value";
}

function isLegendaryCreature(card: CollectionCard): boolean {
  const typeLine = (card.typeLine || "").toLowerCase();
  return typeLine.includes("legendary") && typeLine.includes("creature");
}

/** Score a card for auto-selection priority */
function cardScore(card: CollectionCard, commanderText: string): number {
  let score = 0;
  const rarity = (card.rarity || "").toLowerCase();
  if (rarity === "mythic") score += 8;
  else if (rarity === "rare") score += 6;
  else if (rarity === "uncommon") score += 4;
  else score += 2;

  // Bonus for type synergy with commander
  const oracle = (card.oracleText || "").toLowerCase();
  const cmdText = commanderText.toLowerCase();
  // Simple keyword overlap check
  const keywords = ["token", "counter", "graveyard", "draw", "sacrifice", "energy", "artifact", "enchant", "eldrazi"];
  for (const kw of keywords) {
    if (cmdText.includes(kw) && oracle.includes(kw)) {
      score += 3;
    }
  }

  // Small bonus for creatures (always useful)
  if ((card.typeLine || "").toLowerCase().includes("creature")) score += 1;

  return score;
}

export default function DeckBuilder({ open, onOpenChange }: DeckBuilderProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCommander, setSelectedCommander] = useState<CommanderCandidate | null>(null);
  const [deckSlots, setDeckSlots] = useState<DeckSlot[]>([]);
  const [deckName, setDeckName] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: collectionCards = [], isLoading } = useQuery<CollectionCard[]>({
    queryKey: ["/api/collection"],
  });

  // Find commander candidates from collection
  const commanders = useMemo(() => {
    const legendaries = collectionCards.filter(isLegendaryCreature);

    return legendaries
      .map((card): CommanderCandidate => {
        const ci = parseColors(card.colorIdentity);
        const matching = collectionCards.filter((c) => {
          if (c.id === card.id) return false;
          const cardCI = parseColors(c.colorIdentity);
          // Card fits if all its colors are in the commander's color identity
          // Colorless cards always fit
          if (cardCI.length === 0) return true;
          return cardCI.every((color) => ci.includes(color));
        });
        return {
          card,
          colorIdentity: ci,
          matchingCards: matching.length,
          totalCards: collectionCards.length,
          strategy: getStrategy(card),
        };
      })
      .sort((a, b) => b.matchingCards - a.matchingCards)
      .slice(0, 8);
  }, [collectionCards]);

  // Auto-build deck when commander is selected
  const buildDeck = (commander: CommanderCandidate) => {
    setSelectedCommander(commander);

    const ci = commander.colorIdentity;
    const commanderOracleText = commander.card.oracleText || "";

    // Filter cards that fit the commander's color identity
    const eligible = collectionCards
      .filter((c) => {
        if (c.id === commander.card.id) return false;
        const cardCI = parseColors(c.colorIdentity);
        if (cardCI.length === 0) return true;
        return cardCI.every((color) => ci.includes(color));
      })
      .filter((c) => {
        // Skip basic lands (we'll add those separately)
        const typeLine = (c.typeLine || "").toLowerCase();
        return !typeLine.match(/^basic land/);
      });

    // Score and sort
    const scored = eligible
      .map((card) => ({ card, score: cardScore(card, commanderOracleText) }))
      .sort((a, b) => b.score - a.score);

    // Pick cards for the deck (99 slots, 1 for commander)
    const slots: DeckSlot[] = [
      { card: commander.card, quantity: 1, isCommander: true },
    ];
    let totalCards = 1;
    const TARGET = 100;

    // Add non-land, non-basic cards
    for (const { card } of scored) {
      if (totalCards >= TARGET - 10) break; // Leave room for basic lands
      const qty = Math.min(card.quantity || 1, 1); // 1 copy per card in Commander
      slots.push({ card, quantity: qty });
      totalCards += qty;
    }

    // Fill remaining slots with basic lands
    const remaining = TARGET - totalCards;
    if (remaining > 0 && ci.length > 0) {
      const landsPerColor = Math.floor(remaining / ci.length);
      const extra = remaining % ci.length;

      ci.forEach((color, idx) => {
        const landName = BASIC_LANDS[color];
        if (!landName) return;
        const qty = landsPerColor + (idx < extra ? 1 : 0);
        if (qty > 0) {
          // Create a placeholder basic land entry
          slots.push({
            card: {
              id: -(idx + 1), // Negative ID for placeholder
              scryfallId: `basic-${color.toLowerCase()}`,
              name: landName,
              typeLine: "Basic Land",
              manaCost: null,
              cmc: 0,
              imageSmall: null,
              imageNormal: null,
              priceUsd: null,
              colors: "[]",
              colorIdentity: JSON.stringify([color]),
              rarity: "common",
              setName: null,
              setCode: null,
              quantity: qty,
              oracleText: null,
              power: null,
              toughness: null,
            },
            quantity: qty,
          });
        }
      });
    } else if (remaining > 0) {
      // Colorless commander — add Wastes
      slots.push({
        card: {
          id: -100,
          scryfallId: "basic-wastes",
          name: "Wastes",
          typeLine: "Basic Land",
          manaCost: null,
          cmc: 0,
          imageSmall: null,
          imageNormal: null,
          priceUsd: null,
          colors: "[]",
          colorIdentity: "[]",
          rarity: "common",
          setName: null,
          setCode: null,
          quantity: remaining,
          oracleText: null,
          power: null,
          toughness: null,
        },
        quantity: remaining,
      });
    }

    setDeckSlots(slots);
    setDeckName(`${commander.card.name} Commander`);
    setStep(2);
  };

  const totalDeckCards = deckSlots.reduce((sum, s) => sum + s.quantity, 0);

  const removeSlot = (idx: number) => {
    setDeckSlots((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateSlotQty = (idx: number, delta: number) => {
    setDeckSlots((prev) =>
      prev.map((s, i) => {
        if (i !== idx) return s;
        const newQty = Math.max(0, s.quantity + delta);
        return { ...s, quantity: newQty };
      }).filter((s) => s.quantity > 0)
    );
  };

  // Save deck mutation
  const saveDeckMutation = useMutation({
    mutationFn: async () => {
      // Step 1: Create the deck
      const deckRes = await apiRequest("POST", "/api/decks", {
        name: deckName || "New Commander Deck",
        format: "commander",
        description: selectedCommander
          ? `Commander: ${selectedCommander.card.name}. ${selectedCommander.strategy}.`
          : null,
        coverImage: selectedCommander?.card.imageNormal || selectedCommander?.card.imageSmall || null,
      });
      const deck = await deckRes.json();

      // Step 2: Resolve card names via Scryfall for proper data
      const nonBasicSlots = deckSlots.filter((s) => s.card.id > 0);
      const basicSlots = deckSlots.filter((s) => s.card.id <= 0);

      // Resolve non-basic cards
      const identifiers = nonBasicSlots.map((s) => ({ name: s.card.name }));

      let resolvedMap = new Map<string, ScryfallCard>();
      if (identifiers.length > 0) {
        const resolveRes = await apiRequest("POST", "/api/scryfall/collection", {
          identifiers,
        });
        const resolveData = await resolveRes.json();
        const found: ScryfallCard[] = resolveData.data || [];
        for (const card of found) {
          resolvedMap.set(card.name.toLowerCase(), card);
          if (card.card_faces && card.card_faces.length > 0) {
            resolvedMap.set(card.card_faces[0].name.toLowerCase(), card);
          }
        }
      }

      // Resolve basic lands
      if (basicSlots.length > 0) {
        const basicIdentifiers = basicSlots.map((s) => ({ name: s.card.name }));
        const basicRes = await apiRequest("POST", "/api/scryfall/collection", {
          identifiers: basicIdentifiers,
        });
        const basicData = await basicRes.json();
        for (const card of (basicData.data || []) as ScryfallCard[]) {
          resolvedMap.set(card.name.toLowerCase(), card);
        }
      }

      // Step 3: Add cards to deck
      let added = 0;
      for (const slot of deckSlots) {
        const resolved = resolvedMap.get(slot.card.name.toLowerCase());
        if (!resolved) continue;

        const cardData: Record<string, any> = {
          scryfallId: resolved.id,
          name: resolved.name,
          typeLine: resolved.type_line,
          manaCost: resolved.mana_cost || null,
          cmc: resolved.cmc ? Math.floor(resolved.cmc) : 0,
          imageSmall: resolved.image_uris?.small || resolved.card_faces?.[0]?.image_uris?.small || null,
          imageNormal: resolved.image_uris?.normal || resolved.card_faces?.[0]?.image_uris?.normal || null,
          colors: JSON.stringify(resolved.colors || []),
          colorIdentity: JSON.stringify(resolved.color_identity || []),
          rarity: resolved.rarity || null,
          oracleText: resolved.oracle_text || null,
          power: resolved.power || null,
          toughness: resolved.toughness || null,
          quantity: slot.quantity,
          board: "main",
          priceUsd: resolved.prices?.usd || null,
          isCommander: slot.isCommander || false,
          legalities: resolved.legalities ? JSON.stringify(resolved.legalities) : null,
        };

        await apiRequest("POST", `/api/decks/${deck.id}/cards`, cardData);
        added++;
      }

      return { deckId: deck.id, added };
    },
    onSuccess: ({ deckId, added }) => {
      toast({
        title: "Deck created!",
        description: `${added} cards added to "${deckName}"`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      onOpenChange(false);
      setStep(1);
      setSelectedCommander(null);
      setDeckSlots([]);
      setDeckName("");
      setLocation(`/decks/${deckId}`);
    },
    onError: (err: Error) => {
      toast({
        title: "Failed to save deck",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleClose = (open: boolean) => {
    if (!open) {
      setStep(1);
      setSelectedCommander(null);
      setDeckSlots([]);
      setDeckName("");
    }
    onOpenChange(open);
  };

  // Group deck slots by type for the review step
  const groupedSlots = useMemo(() => {
    const groups: Record<string, DeckSlot[]> = {
      Commander: [],
      Creatures: [],
      Instants: [],
      Sorceries: [],
      Artifacts: [],
      Enchantments: [],
      Planeswalkers: [],
      Lands: [],
      Other: [],
    };

    for (const slot of deckSlots) {
      if (slot.isCommander) {
        groups.Commander.push(slot);
        continue;
      }
      const type = (slot.card.typeLine || "").toLowerCase();
      if (type.includes("land")) groups.Lands.push(slot);
      else if (type.includes("creature")) groups.Creatures.push(slot);
      else if (type.includes("instant")) groups.Instants.push(slot);
      else if (type.includes("sorcery")) groups.Sorceries.push(slot);
      else if (type.includes("artifact")) groups.Artifacts.push(slot);
      else if (type.includes("enchantment")) groups.Enchantments.push(slot);
      else if (type.includes("planeswalker")) groups.Planeswalkers.push(slot);
      else groups.Other.push(slot);
    }

    return Object.entries(groups).filter(([, slots]) => slots.length > 0);
  }, [deckSlots]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="deck-builder">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-primary" />
            {step === 1 && "Choose a Commander"}
            {step === 2 && "Review Your Deck"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {step === 1 && "Select a legendary creature from your collection to lead your Commander deck."}
            {step === 2 && `${totalDeckCards}/100 cards selected. Review and adjust before saving.`}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-2">
          <div className={`flex items-center gap-1.5 text-xs ${step >= 1 ? "text-primary font-medium" : "text-muted-foreground"}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              {step > 1 ? <Check className="w-3 h-3" /> : "1"}
            </div>
            Commander
          </div>
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
          <div className={`flex items-center gap-1.5 text-xs ${step >= 2 ? "text-primary font-medium" : "text-muted-foreground"}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              {step > 2 ? <Check className="w-3 h-3" /> : "2"}
            </div>
            Review & Save
          </div>
        </div>

        {/* STEP 1: Commander Selection */}
        {step === 1 && (
          <div className="space-y-3">
            {isLoading && (
              <div className="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading collection...
              </div>
            )}

            {!isLoading && collectionCards.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Your collection is empty. Import cards first to build a deck.
                </p>
              </div>
            )}

            {!isLoading && collectionCards.length > 0 && commanders.length === 0 && (
              <div className="text-center py-8">
                <Crown className="w-8 h-8 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  No legendary creatures found in your collection.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Import some legendary creatures to use as commanders.
                </p>
              </div>
            )}

            {commanders.length > 0 && (
              <div className="space-y-2">
                {commanders.map((cmd) => (
                  <button
                    key={cmd.card.id}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-card-border hover:border-primary/50 transition-colors text-left"
                    onClick={() => buildDeck(cmd)}
                    data-testid={`commander-${cmd.card.id}`}
                  >
                    {cmd.card.imageSmall ? (
                      <img
                        src={cmd.card.imageSmall}
                        alt={cmd.card.name}
                        className="w-12 h-16 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-16 rounded bg-muted flex-shrink-0 flex items-center justify-center">
                        <Crown className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{cmd.card.name}</span>
                        {cmd.card.manaCost && <ManaCost cost={cmd.card.manaCost} size="sm" />}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        {cmd.colorIdentity.length === 0 && (
                          <Badge variant="outline" className="text-[9px] h-4">Colorless</Badge>
                        )}
                        {cmd.colorIdentity.map((c) => (
                          <span
                            key={c}
                            className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold ${COLOR_SYMBOLS[c]?.bg || "bg-muted"}`}
                          >
                            {c}
                          </span>
                        ))}
                        <span className="text-[10px] text-muted-foreground ml-1">
                          {cmd.matchingCards} cards fit
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                        {cmd.strategy}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Review Deck */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                placeholder="Deck Name"
                className="flex-1 h-8 text-sm"
                data-testid="deck-name-input"
              />
              <Badge variant={totalDeckCards === 100 ? "default" : "secondary"} className="text-xs shrink-0">
                {totalDeckCards}/100
              </Badge>
            </div>

            <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
              {groupedSlots.map(([group, slots]) => (
                <div key={group}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {group}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      ({slots.reduce((s, sl) => s + sl.quantity, 0)})
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {slots.map((slot, idx) => {
                      const globalIdx = deckSlots.indexOf(slot);
                      return (
                        <div
                          key={`${slot.card.name}-${idx}`}
                          className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-muted/50 group text-xs"
                        >
                          {slot.isCommander && (
                            <Crown className="w-3 h-3 text-amber-500 flex-shrink-0" />
                          )}
                          <span className="font-mono text-muted-foreground w-5 text-right">
                            {slot.quantity}x
                          </span>
                          <span className="flex-1 truncate">{slot.card.name}</span>
                          {slot.card.manaCost && (
                            <ManaCost cost={slot.card.manaCost} size="sm" />
                          )}
                          {!slot.isCommander && (
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                className="w-5 h-5 rounded flex items-center justify-center hover:bg-muted"
                                onClick={() => updateSlotQty(globalIdx, -1)}
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <button
                                className="w-5 h-5 rounded flex items-center justify-center hover:bg-muted"
                                onClick={() => updateSlotQty(globalIdx, 1)}
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                              <button
                                className="w-5 h-5 rounded flex items-center justify-center hover:bg-destructive/20 text-destructive"
                                onClick={() => removeSlot(globalIdx)}
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(1)}
                className="gap-1.5"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </Button>
              <div className="flex-1" />
              <Button
                size="sm"
                onClick={() => saveDeckMutation.mutate()}
                disabled={saveDeckMutation.isPending || deckSlots.length === 0}
                className="gap-1.5"
                data-testid="save-deck-btn"
              >
                {saveDeckMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Save Deck
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
