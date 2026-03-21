import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import { ManaCost } from "@/components/ManaSymbols";
import { ExternalLink, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface SharedCard {
  name: string;
  qty: number;
}

interface SharedDeckData {
  name: string;
  format: string;
  commander?: string;
  cards: SharedCard[];
}

interface ScryfallCardInfo {
  name: string;
  image_uris?: { small: string; normal: string };
  card_faces?: Array<{ image_uris?: { small: string; normal: string } }>;
  type_line: string;
  mana_cost?: string;
  cmc?: number;
}

export function encodeSharedDeck(deck: {
  name: string;
  format: string;
  commander?: string;
  cards: Array<{ name: string; quantity: number }>;
}): string {
  const data: SharedDeckData = {
    name: deck.name,
    format: deck.format,
    commander: deck.commander,
    cards: deck.cards.map((c) => ({ name: c.name, qty: c.quantity })),
  };
  return compressToEncodedURIComponent(JSON.stringify(data));
}

export function decodeSharedDeck(encoded: string): SharedDeckData | null {
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    return JSON.parse(json) as SharedDeckData;
  } catch {
    return null;
  }
}

export default function SharedDeckPage() {
  const [, params] = useRoute("/shared/:data");
  const encodedData = params?.data || "";
  const deckData = decodeSharedDeck(encodedData);
  const [cardImages, setCardImages] = useState<Record<string, ScryfallCardInfo>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!deckData) {
      setLoading(false);
      return;
    }

    const fetchCardImages = async () => {
      const names = deckData.cards.map((c) => c.name);
      const batches: string[][] = [];
      for (let i = 0; i < names.length; i += 75) {
        batches.push(names.slice(i, i + 75));
      }

      const allCards: Record<string, ScryfallCardInfo> = {};
      for (const batch of batches) {
        try {
          const res = await fetch("https://api.scryfall.com/cards/collection", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifiers: batch.map((name) => ({ name })) }),
          });
          if (res.ok) {
            const data = await res.json();
            for (const card of data.data || []) {
              allCards[card.name] = card;
            }
          }
        } catch {
          // Continue with what we have
        }
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise((r) => setTimeout(r, 100));
        }
      }
      setCardImages(allCards);
      setLoading(false);
    };

    fetchCardImages();
  }, [encodedData]);

  if (!deckData) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="text-2xl font-bold">Invalid Share Link</div>
        <p className="text-muted-foreground">This shared deck link is invalid or corrupted.</p>
        <Link href="/">
          <Button>Open Sabrina's Vault</Button>
        </Link>
      </div>
    );
  }

  const typeOrder = ["Creatures", "Planeswalkers", "Instants", "Sorceries", "Enchantments", "Artifacts", "Lands", "Other"];

  const categorize = (typeLine: string): string => {
    const raw = typeLine.split("—")[0].trim();
    if (raw.includes("Creature")) return "Creatures";
    if (raw.includes("Planeswalker")) return "Planeswalkers";
    if (raw.includes("Instant")) return "Instants";
    if (raw.includes("Sorcery")) return "Sorceries";
    if (raw.includes("Enchantment")) return "Enchantments";
    if (raw.includes("Artifact")) return "Artifacts";
    if (raw.includes("Land")) return "Lands";
    return "Other";
  };

  const grouped: Record<string, Array<SharedCard & { info?: ScryfallCardInfo }>> = {};
  const commanderCards: Array<SharedCard & { info?: ScryfallCardInfo }> = [];

  for (const card of deckData.cards) {
    const info = cardImages[card.name];
    const enriched = { ...card, info };
    if (deckData.commander && card.name === deckData.commander) {
      commanderCards.push(enriched);
      continue;
    }
    const type = info ? categorize(info.type_line) : "Other";
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(enriched);
  }

  const totalCards = deckData.cards.reduce((s, c) => s + c.qty, 0);

  const copyDecklist = () => {
    let text = "";
    if (commanderCards.length > 0) {
      text += "Commander\n";
      for (const c of commanderCards) text += `${c.qty} ${c.name}\n`;
      text += "\nDeck\n";
    }
    for (const type of typeOrder) {
      if (!grouped[type]?.length) continue;
      if (text.length > 0 && !text.endsWith("\n\n")) text += "\n";
      text += `// ${type}\n`;
      for (const c of grouped[type]) text += `${c.qty} ${c.name}\n`;
    }
    navigator.clipboard.writeText(text.trim());
    toast({ title: "Decklist copied to clipboard" });
  };

  return (
    <div className="space-y-4" data-testid="shared-deck-page">
      {/* Shared deck banner */}
      <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Badge className="bg-primary/20 text-primary border-primary/30">Shared Deck</Badge>
          <span className="text-sm text-muted-foreground">View Only</span>
        </div>
        <Link href="/">
          <Button variant="secondary" size="sm" className="gap-1 text-xs">
            <ExternalLink className="w-3 h-3" />
            Open Sabrina's Vault
          </Button>
        </Link>
      </div>

      {/* Deck header */}
      <div>
        <h1 className="text-lg font-bold">{deckData.name}</h1>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-[10px] capitalize">{deckData.format}</Badge>
          <span>{totalCards} cards</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Loading card images...</p>
        </div>
      ) : (
        <>
          {/* Copy button */}
          <Button variant="secondary" size="sm" className="gap-1 text-xs" onClick={copyDecklist}>
            <Copy className="w-3.5 h-3.5" />
            Copy Decklist
          </Button>

          {/* Commander section */}
          {commanderCards.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 border-b border-primary/20 pb-1">
                Commander ({commanderCards.length})
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                {commanderCards.map((card) => (
                  <SharedCardTile key={card.name} card={card} />
                ))}
              </div>
            </div>
          )}

          {/* Cards by type */}
          {typeOrder.map((type) => {
            const cards = grouped[type];
            if (!cards?.length) return null;
            const typeTotal = cards.reduce((s, c) => s + c.qty, 0);
            return (
              <div key={type}>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 border-b border-primary/20 pb-1">
                  {type} ({typeTotal})
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                  {cards.map((card) => (
                    <SharedCardTile key={card.name} card={card} />
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

function SharedCardTile({ card }: { card: SharedCard & { info?: ScryfallCardInfo } }) {
  const image =
    card.info?.image_uris?.normal ||
    card.info?.image_uris?.small ||
    card.info?.card_faces?.[0]?.image_uris?.normal ||
    card.info?.card_faces?.[0]?.image_uris?.small;

  return (
    <div className="relative group">
      {image ? (
        <img src={image} alt={card.name} className="w-full rounded-lg" loading="lazy" />
      ) : (
        <div className="w-full aspect-[5/7] rounded-lg bg-muted flex items-center justify-center">
          <span className="text-[10px] text-muted-foreground text-center px-1">{card.name}</span>
        </div>
      )}
      {card.qty > 1 && (
        <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
          {card.qty}
        </div>
      )}
      <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
        <div className="w-full bg-gradient-to-t from-black/80 to-transparent rounded-b-lg px-2 py-1.5">
          <span className="text-[10px] text-white font-medium leading-tight line-clamp-2">{card.name}</span>
          {card.info?.mana_cost && (
            <div className="mt-0.5">
              <ManaCost cost={card.info.mana_cost} size="sm" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
