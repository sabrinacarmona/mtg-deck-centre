export interface KnownCombo {
  cards: string[];
  result: string;
  commander?: string;
}

export const KNOWN_COMBOS: KnownCombo[] = [
  {
    cards: ["Savage Ventmaw", "Aggravated Assault"],
    result: "Infinite combat steps. Savage Ventmaw adds 6 mana on attack, Aggravated Assault costs 5 to activate. Net +1 mana each loop for infinite attacks.",
    commander: "Atarka, World Render",
  },
  {
    cards: ["Deadeye Navigator", "Gonti, Lord of Luxury"],
    result: "Infinite ETB triggers. Pair Deadeye with any ETB creature, pay 1U to flicker repeatedly for unlimited theft, ramp, or drain.",
    commander: "Gonti, Canny Acquisitor",
  },
  {
    cards: ["Panharmonicon", "Gonti, Lord of Luxury"],
    result: "Double ETB triggers. Every creature that enters the battlefield triggers its ability twice — steal two cards instead of one.",
    commander: "Gonti, Canny Acquisitor",
  },
  {
    cards: ["Panharmonicon", "Solemn Simulacrum"],
    result: "Double ramp + double draw. Solemn enters and fetches 2 lands. When it dies, draw 2 cards. Incredible value engine.",
    commander: "Dr. Madison Li",
  },
  {
    cards: ["Basalt Monolith", "Forsaken Monument"],
    result: "Infinite colorless mana. Basalt Monolith taps for 3 colorless, Forsaken Monument adds +2, untap for 3 = net +2 each loop.",
    commander: "Sauron, Lord of the Rings",
  },
  {
    cards: ["Sauron, Lord of the Rings", "Guttersnipe"],
    result: "Every instant or sorcery you cast deals 2 damage to each opponent via Guttersnipe, while Sauron's army grows with Amass triggers.",
    commander: "Sauron, Lord of the Rings",
  },
  {
    cards: ["Living Death", "Sauron, Lord of the Rings"],
    result: "Mass reanimation. Fill your graveyard with big creatures, then Living Death swaps graveyards and battlefields — your opponents lose their boards while yours comes back.",
    commander: "Sauron, Lord of the Rings",
  },
  {
    cards: ["Storm-Kiln Artist", "Reiterate"],
    result: "Treasure generation engine. Each spell cast creates Treasure via Storm-Kiln. Reiterate copies spells while generating more Treasure than it costs.",
    commander: "Shiko and Narset, Unified",
  },
  {
    cards: ["Mana Geyser", "Reiterate"],
    result: "Infinite red mana. In a multiplayer game, Mana Geyser often produces 10+ mana. Reiterate with buyback copies it for 6 mana, netting infinite red.",
    commander: "Shiko and Narset, Unified",
  },
  {
    cards: ["Liberty Prime, Recharged", "Panharmonicon"],
    result: "Energy generation engine. Each artifact ETB produces double energy, keeping Liberty Prime fueled and making energy-payoff cards devastating.",
    commander: "Dr. Madison Li",
  },
  {
    cards: ["Niv-Mizzet, Parun", "Curiosity"],
    result: "Infinite damage and draw. Niv-Mizzet deals 1 damage when you draw. Curiosity on Niv draws a card when it deals damage. Each draw triggers another damage, which triggers another draw.",
    commander: "Shiko and Narset, Unified",
  },
  {
    cards: ["Atarka, World Render", "Savage Ventmaw"],
    result: "Savage Ventmaw with double strike from Atarka produces 12 mana total on attack (6 from each strike), funding more dragons post-combat.",
    commander: "Atarka, World Render",
  },
  {
    cards: ["Dragon Tempest", "Scourge of Valkas"],
    result: "Each dragon that enters deals damage equal to the number of dragons you control — from both cards. With 4 dragons, a new one deals 8+ damage on entry.",
    commander: "Atarka, World Render",
  },
];

export interface ComboMatch {
  combo: KnownCombo;
  presentCards: string[];
  missingCards: string[];
  complete: boolean;
}

/** Scan deck cards for known combo pieces and return matches */
export function findCombos(
  deckCardNames: string[],
  commanderName?: string
): ComboMatch[] {
  const nameSet = new Set(deckCardNames.map((n) => n.toLowerCase()));
  const results: ComboMatch[] = [];

  for (const combo of KNOWN_COMBOS) {
    const present: string[] = [];
    const missing: string[] = [];

    for (const card of combo.cards) {
      if (nameSet.has(card.toLowerCase())) {
        present.push(card);
      } else {
        missing.push(card);
      }
    }

    // Show if at least one piece is present
    if (present.length > 0) {
      results.push({
        combo,
        presentCards: present,
        missingCards: missing,
        complete: missing.length === 0,
      });
    }
  }

  // Sort: complete combos first, then by fewer missing pieces
  results.sort((a, b) => {
    if (a.complete !== b.complete) return a.complete ? -1 : 1;
    return a.missingCards.length - b.missingCards.length;
  });

  return results;
}
