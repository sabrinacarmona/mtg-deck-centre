import { AlertTriangle, Droplets } from "lucide-react";
import { ManaSymbol } from "@/components/ManaSymbols";

interface DeckCardLike {
  name: string;
  typeLine: string;
  manaCost: string | null;
  oracleText: string | null;
  cmc: number | null;
  quantity: number | null;
}

const BASIC_LAND_MAP: Record<string, string> = {
  Plains: "W",
  Island: "U",
  Swamp: "B",
  Mountain: "R",
  Forest: "G",
};

const COLOR_NAMES: Record<string, string> = {
  W: "White",
  U: "Blue",
  B: "Black",
  R: "Red",
  G: "Green",
};

function countPips(cards: DeckCardLike[]): Record<string, number> {
  const pips: Record<string, number> = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  for (const card of cards) {
    if (!card.manaCost) continue;
    if (card.typeLine.toLowerCase().includes("land")) continue;
    const symbols = card.manaCost.match(/\{([^}]+)\}/g) || [];
    const qty = card.quantity || 1;
    for (const sym of symbols) {
      const code = sym.replace(/[{}]/g, "").toUpperCase();
      if (pips[code] !== undefined) {
        pips[code] += qty;
      }
      // Handle hybrid mana like {W/U}
      if (code.includes("/")) {
        for (const half of code.split("/")) {
          if (pips[half] !== undefined) {
            pips[half] += qty * 0.5;
          }
        }
      }
    }
  }
  // Round halves
  for (const k of Object.keys(pips)) {
    pips[k] = Math.ceil(pips[k]);
  }
  return pips;
}

function countSources(cards: DeckCardLike[]): Record<string, number> {
  const sources: Record<string, number> = { W: 0, U: 0, B: 0, R: 0, G: 0 };

  for (const card of cards) {
    const typeLine = (card.typeLine || "").toLowerCase();
    const oracle = (card.oracleText || "").toLowerCase();
    const qty = card.quantity || 1;

    if (!typeLine.includes("land") && !oracle.includes("add {") && !oracle.includes("add one mana")) {
      continue;
    }

    // Check basic land types in the type line
    for (const [landName, color] of Object.entries(BASIC_LAND_MAP)) {
      if (card.name === landName || typeLine.includes(landName.toLowerCase())) {
        sources[color] += qty;
      }
    }

    // Check oracle text for "Add {X}" patterns
    const addMatches = oracle.match(/add \{([wubrgc])}/gi) || [];
    for (const match of addMatches) {
      const code = match.replace(/add \{/i, "").replace("}", "").toUpperCase();
      if (sources[code] !== undefined) {
        // Avoid double-counting basic lands we already detected via type line
        const alreadyCounted = Object.entries(BASIC_LAND_MAP).some(
          ([landName]) => card.name === landName || typeLine.includes(landName.toLowerCase())
        );
        if (!alreadyCounted) {
          sources[code] += qty;
        }
      }
    }

    // "any color" or "any combination" = counts for all
    if (oracle.includes("add one mana of any color") || oracle.includes("mana of any color") || oracle.includes("any combination of colors")) {
      const alreadyCounted = Object.entries(BASIC_LAND_MAP).some(
        ([landName]) => card.name === landName || typeLine.includes(landName.toLowerCase())
      );
      if (!alreadyCounted) {
        for (const color of Object.keys(sources)) {
          sources[color] += qty;
        }
      }
    }
  }

  return sources;
}

export default function ManaAnalyzer({ cards }: { cards: DeckCardLike[] }) {
  const nonLandCards = cards.filter((c) => !c.typeLine.toLowerCase().includes("land"));
  const landCards = cards.filter((c) => c.typeLine.toLowerCase().includes("land"));
  const totalLands = landCards.reduce((s, c) => s + (c.quantity || 1), 0);
  const totalNonLand = nonLandCards.reduce((s, c) => s + (c.quantity || 1), 0);

  const pips = countPips(cards);
  const sources = countSources(cards);

  const avgCmc =
    totalNonLand > 0
      ? nonLandCards.reduce((s, c) => s + (c.cmc || 0) * (c.quantity || 1), 0) / totalNonLand
      : 0;

  // Only show colors that have pips or sources
  const activeColors = Object.keys(pips).filter(
    (c) => pips[c] > 0 || sources[c] > 0
  );

  const maxValue = Math.max(
    ...activeColors.map((c) => Math.max(pips[c], sources[c])),
    1
  );

  const warnings: string[] = [];
  for (const color of activeColors) {
    if (pips[color] > 0 && sources[color] < pips[color]) {
      warnings.push(
        `${COLOR_NAMES[color]}: ${pips[color]} pips needed but only ${sources[color]} source${sources[color] !== 1 ? "s" : ""}`
      );
    }
  }
  if (totalLands < 36) {
    warnings.push(`Only ${totalLands} lands — Commander decks recommend 36-38`);
  } else if (totalLands > 40) {
    warnings.push(`${totalLands} lands is quite high — consider cutting 1-2 for spells`);
  }

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="bg-muted/50 rounded-lg px-3 py-2">
          <span className="text-muted-foreground">Lands: </span>
          <span className="font-semibold">{totalLands}</span>
        </div>
        <div className="bg-muted/50 rounded-lg px-3 py-2">
          <span className="text-muted-foreground">Non-land: </span>
          <span className="font-semibold">{totalNonLand}</span>
        </div>
        <div className="bg-muted/50 rounded-lg px-3 py-2">
          <span className="text-muted-foreground">Avg CMC: </span>
          <span className="font-semibold">{avgCmc.toFixed(2)}</span>
        </div>
      </div>

      {/* Bar chart */}
      {activeColors.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground mb-1">
            <span className="flex items-center gap-1">
              <span className="w-3 h-2 rounded-sm bg-primary/70 inline-block" /> Pips needed
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-2 rounded-sm bg-emerald-500/50 inline-block" /> Sources available
            </span>
          </div>
          {activeColors.map((color) => (
            <div key={color} className="flex items-center gap-2">
              <ManaSymbol symbol={color} size="sm" />
              <div className="flex-1 space-y-0.5">
                {/* Pips bar */}
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/70 rounded-full transition-all"
                      style={{ width: `${(pips[color] / maxValue) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-6 text-right">
                    {pips[color]}
                  </span>
                </div>
                {/* Sources bar */}
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        sources[color] >= pips[color] ? "bg-emerald-500/50" : "bg-red-500/50"
                      }`}
                      style={{ width: `${(sources[color] / maxValue) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-6 text-right">
                    {sources[color]}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No colored mana pips detected in this deck.</p>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-1.5">
          {warnings.map((w, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1.5"
            >
              <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
