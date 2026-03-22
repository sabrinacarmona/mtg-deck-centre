import { useState, useMemo, useCallback, useRef, useEffect } from "react";
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
  Filter,
  X,
  Search,
  ChevronDown,
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

const MANA_COLORS = ["W", "U", "B", "R", "G"] as const;
const RARITY_OPTIONS = ["common", "uncommon", "rare", "mythic"] as const;
const TYPE_OPTIONS = ["Creature", "Instant", "Sorcery", "Enchantment", "Artifact", "Land", "Planeswalker"] as const;

const RARITY_LABELS: Record<string, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  mythic: "Mythic",
};

interface DeckBuilderFilters {
  sets: Set<string>;
  colors: Set<string>;
  rarities: Set<string>;
  types: Set<string>;
}

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

  // --- Filters ---
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<DeckBuilderFilters>({
    sets: new Set(),
    colors: new Set(),
    rarities: new Set(),
    types: new Set(),
  });
  const [setSearch, setSetSearch] = useState("");
  const [setDropdownOpen, setSetDropdownOpen] = useState(false);
  const setDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (setDropdownRef.current && !setDropdownRef.current.contains(e.target as Node)) {
        setSetDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const hasActiveFilters = filters.sets.size > 0 || filters.colors.size > 0 || filters.rarities.size > 0 || filters.types.size > 0;

  const clearFilters = useCallback(() => {
    setFilters({ sets: new Set(), colors: new Set(), rarities: new Set(), types: new Set() });
    setSetSearch("");
  }, []);

  const toggleFilter = useCallback(<K extends keyof DeckBuilderFilters>(key: K, value: string) => {
    setFilters((prev) => {
      const next = new Set(prev[key]);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { ...prev, [key]: next };
    });
  }, []);

  // Compute available sets from collection with card counts
  const availableSets = useMemo(() => {
    const setCounts = new Map<string, number>();
    for (const card of collectionCards) {
      const setName = card.setName || "Unknown";
      setCounts.set(setName, (setCounts.get(setName) || 0) + (card.quantity || 1));
    }
    return Array.from(setCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [collectionCards]);

  // Apply filters to collection
  const filteredCards = useMemo(() => {
    if (!hasActiveFilters) return collectionCards;

    return collectionCards.filter((card) => {
      // Set filter
      if (filters.sets.size > 0) {
        const cardSet = card.setName || "Unknown";
        if (!filters.sets.has(cardSet)) return false;
      }
      // Color identity filter
      if (filters.colors.size > 0) {
        const ci = parseColors(card.colorIdentity);
        const wantColorless = filters.colors.has("C");
        const selectedWUBRG = new Set(Array.from(filters.colors).filter((c) => c !== "C"));
        if (ci.length === 0) {
          // Colorless card: only show if "C" is selected
          if (!wantColorless) return false;
        } else {
          // Colored card: all its colors must be among selected WUBRG colors
          if (selectedWUBRG.size === 0) return false;
          if (!ci.every((c) => selectedWUBRG.has(c))) return false;
        }
      }
      // Rarity filter
      if (filters.rarities.size > 0) {
        const rarity = (card.rarity || "").toLowerCase();
        if (!filters.rarities.has(rarity)) return false;
      }
      // Type filter
      if (filters.types.size > 0) {
        const typeLine = (card.typeLine || "").toLowerCase();
        const matchesType = Array.from(filters.types).some((t) => typeLine.includes(t.toLowerCase()));
        if (!matchesType) return false;
      }
      return true;
    });
  }, [collectionCards, filters, hasActiveFilters]);

  // Find commander candidates from filtered collection
  const commanders = useMemo(() => {
    const legendaries = filteredCards.filter(isLegendaryCreature);

    return legendaries
      .map((card): CommanderCandidate => {
        const ci = parseColors(card.colorIdentity);
        const matching = filteredCards.filter((c) => {
          if (c.id === card.id) return false;
          const cardCI = parseColors(c.colorIdentity);
          if (cardCI.length === 0) return true;
          return cardCI.every((color) => ci.includes(color));
        });
        return {
          card,
          colorIdentity: ci,
          matchingCards: matching.length,
          totalCards: filteredCards.length,
          strategy: getStrategy(card),
        };
      })
      .sort((a, b) => b.matchingCards - a.matchingCards)
      .slice(0, 8);
  }, [filteredCards]);

  // Auto-build deck when commander is selected
  const buildDeck = (commander: CommanderCandidate) => {
    setSelectedCommander(commander);

    const ci = commander.colorIdentity;
    const commanderOracleText = commander.card.oracleText || "";

    // Filter cards that fit the commander's color identity
    const eligible = filteredCards
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
      clearFilters();
      setFiltersOpen(false);
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

        {/* Filters Panel */}
        {step === 1 && !isLoading && collectionCards.length > 0 && (
          <div className="rounded-lg border border-card-border bg-card/50">
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted/50 transition-colors rounded-lg"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <Filter className="w-3.5 h-3.5 text-primary" />
              <span className="font-medium">Filters</span>
              {hasActiveFilters && (
                <Badge variant="default" className="text-[9px] h-4 px-1.5">
                  {filters.sets.size + filters.colors.size + filters.rarities.size + filters.types.size}
                </Badge>
              )}
              {hasActiveFilters && (
                <span className="text-[10px] text-muted-foreground ml-auto mr-2">
                  Building from {filteredCards.length} of {collectionCards.length} cards
                </span>
              )}
              <ChevronDown className={`w-3 h-3 text-muted-foreground ml-auto transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
            </button>

            {filtersOpen && (
              <div className="px-3 pb-3 space-y-2.5 border-t border-card-border pt-2.5">
                {/* Set Filter */}
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Set</label>
                  <div className="relative" ref={setDropdownRef}>
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                      <input
                        type="text"
                        value={setSearch}
                        onChange={(e) => { setSetSearch(e.target.value); setSetDropdownOpen(true); }}
                        onFocus={() => setSetDropdownOpen(true)}
                        placeholder="Search sets..."
                        className="w-full h-7 pl-7 pr-2 text-xs rounded-md border border-input bg-background"
                      />
                    </div>
                    {setDropdownOpen && (
                      <div className="absolute z-50 mt-1 w-full max-h-36 overflow-y-auto rounded-md border bg-popover shadow-md">
                        {availableSets
                          .filter((s) => s.name.toLowerCase().includes(setSearch.toLowerCase()))
                          .map((s) => (
                            <button
                              key={s.name}
                              className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-muted/50 text-left ${filters.sets.has(s.name) ? "bg-primary/10 text-primary" : ""}`}
                              onClick={() => toggleFilter("sets", s.name)}
                            >
                              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${filters.sets.has(s.name) ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                                {filters.sets.has(s.name) && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                              </div>
                              <span className="truncate">{s.name}</span>
                              <span className="text-[10px] text-muted-foreground ml-auto shrink-0">({s.count})</span>
                            </button>
                          ))}
                        {availableSets.filter((s) => s.name.toLowerCase().includes(setSearch.toLowerCase())).length === 0 && (
                          <div className="px-2 py-2 text-xs text-muted-foreground text-center">No sets found</div>
                        )}
                      </div>
                    )}
                  </div>
                  {filters.sets.size > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {Array.from(filters.sets).map((s) => (
                        <Badge key={s} variant="secondary" className="text-[9px] h-5 gap-1 cursor-pointer" onClick={() => toggleFilter("sets", s)}>
                          {s}
                          <X className="w-2.5 h-2.5" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Color Identity Filter */}
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Color Identity</label>
                  <div className="flex items-center gap-1">
                    {MANA_COLORS.map((c) => (
                      <button
                        key={c}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${filters.colors.has(c) ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : "opacity-50 hover:opacity-80"}`}
                        onClick={() => toggleFilter("colors", c)}
                        title={c === "W" ? "White" : c === "U" ? "Blue" : c === "B" ? "Black" : c === "R" ? "Red" : "Green"}
                      >
                        <img
                          src={`https://svgs.scryfall.io/card-symbols/${c}.svg`}
                          alt={c}
                          width={20}
                          height={20}
                          className="rounded-full"
                        />
                      </button>
                    ))}
                    <button
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${filters.colors.has("C") ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : "opacity-50 hover:opacity-80"}`}
                      onClick={() => toggleFilter("colors", "C")}
                      title="Colorless"
                    >
                      <img
                        src="https://svgs.scryfall.io/card-symbols/C.svg"
                        alt="C"
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                    </button>
                  </div>
                </div>

                {/* Rarity Filter */}
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Rarity</label>
                  <div className="flex items-center gap-1">
                    {RARITY_OPTIONS.map((r) => (
                      <button
                        key={r}
                        className={`h-6 px-2 rounded-md text-[10px] font-medium border transition-colors ${
                          filters.rarities.has(r)
                            ? r === "mythic" ? "bg-amber-600 border-amber-600 text-white"
                            : r === "rare" ? "bg-amber-500 border-amber-500 text-white"
                            : r === "uncommon" ? "bg-slate-400 border-slate-400 text-white"
                            : "bg-gray-600 border-gray-600 text-white"
                            : "border-muted-foreground/20 text-muted-foreground hover:border-muted-foreground/40"
                        }`}
                        onClick={() => toggleFilter("rarities", r)}
                      >
                        {RARITY_LABELS[r]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Card Type Filter */}
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Card Type</label>
                  <div className="flex items-center gap-1 flex-wrap">
                    {TYPE_OPTIONS.map((t) => (
                      <button
                        key={t}
                        className={`h-6 px-2 rounded-md text-[10px] font-medium border transition-colors ${
                          filters.types.has(t)
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/20 text-muted-foreground hover:border-muted-foreground/40"
                        }`}
                        onClick={() => toggleFilter("types", t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-muted-foreground" onClick={clearFilters}>
                    <X className="w-3 h-3" />
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

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
                  {hasActiveFilters
                    ? "No legendary creatures match your filters."
                    : "No legendary creatures found in your collection."}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {hasActiveFilters
                    ? "Try adjusting or clearing your filters."
                    : "Import some legendary creatures to use as commanders."}
                </p>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" className="mt-2 text-xs gap-1" onClick={clearFilters}>
                    <X className="w-3 h-3" />
                    Clear Filters
                  </Button>
                )}
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
