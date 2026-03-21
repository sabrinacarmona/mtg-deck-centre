export interface UpgradeSuggestion {
  cardName: string;
  price: string;
  reason: string;
  category: "synergy" | "ramp" | "removal" | "draw" | "protection";
}

export const UPGRADE_SUGGESTIONS: Record<string, UpgradeSuggestion[]> = {
  "Atarka, World Render": [
    { cardName: "Thrakkus the Butcher", price: "$3", reason: "Doubles a Dragon's power when attacking, one-shots with Atarka's double strike", category: "synergy" },
    { cardName: "Lathliss, Dragon Queen", price: "$1", reason: "Creates 5/5 Dragon tokens whenever you cast non-token Dragons", category: "synergy" },
    { cardName: "Old Gnawbone", price: "$25", reason: "Creates Treasure on combat damage, massive mana acceleration", category: "ramp" },
    { cardName: "Terror of the Peaks", price: "$8", reason: "Deals damage equal to each creature's power when it enters", category: "synergy" },
    { cardName: "Rivaz of the Claw", price: "$1", reason: "Taps for Dragon mana and lets you cast Dragons from graveyard", category: "ramp" },
    { cardName: "Rhythm of the Wild", price: "$2", reason: "Gives creatures riot (haste or +1/+1) and can't be countered", category: "protection" },
    { cardName: "Return of the Wildspeaker", price: "$1", reason: "Draw cards equal to greatest creature power, or pump all non-Humans", category: "draw" },
    { cardName: "Aggravated Assault", price: "$25", reason: "Extra combat steps, goes infinite with Savage Ventmaw", category: "synergy" },
  ],
  "Olivia, Opulent Outlaw": [
    { cardName: "Pitiless Plunderer", price: "$8", reason: "Creates Treasure whenever a creature dies, synergizes with Olivia's crime triggers", category: "synergy" },
    { cardName: "Grim Hireling", price: "$5", reason: "Creates Treasures on combat damage, can remove creatures by spending Treasures", category: "synergy" },
    { cardName: "Black Market Connections", price: "$8", reason: "Draws cards, creates Treasures, or makes changelings every upkeep at the cost of life", category: "draw" },
    { cardName: "Professional Face-Breaker", price: "$3", reason: "Creates Treasures on combat damage, sacrifice Treasures for impulse draw", category: "synergy" },
    { cardName: "Smothering Tithe", price: "$20", reason: "Creates Treasures whenever opponents draw cards — the best white Treasure generator", category: "ramp" },
    { cardName: "Anointed Procession", price: "$15", reason: "Doubles all token creation including Treasures, Food, and Clues", category: "synergy" },
    { cardName: "Teferi's Protection", price: "$8", reason: "Phases you out completely, protecting your Treasure hoard from wipes", category: "protection" },
    { cardName: "Vandalblast", price: "$1", reason: "One-sided artifact removal, clears opponents' boards while keeping your Treasures", category: "removal" },
  ],
  "Sauron, Lord of the Rings": [
    { cardName: "Flayer of the Hatebound", price: "$1", reason: "Deals damage when creatures enter from graveyard", category: "synergy" },
    { cardName: "Living Death", price: "$5", reason: "Mass reanimation, swaps graveyards and battlefields", category: "synergy" },
    { cardName: "Toxic Deluge", price: "$8", reason: "Flexible board wipe, pays life for -X/-X", category: "removal" },
    { cardName: "Phyrexian Arena", price: "$3", reason: "Steady card draw for 1 life per turn", category: "draw" },
    { cardName: "Gray Merchant of Asphodel", price: "$0.50", reason: "Drains opponents based on black devotion", category: "synergy" },
    { cardName: "Animate Dead", price: "$5", reason: "Cheap reanimation for your graveyard", category: "synergy" },
    { cardName: "Feed the Swarm", price: "$0.25", reason: "Black enchantment removal, rare for the color", category: "removal" },
    { cardName: "Dreadhorde Invasion", price: "$1", reason: "Creates Amass tokens, builds Army over time", category: "synergy" },
  ],
  "Shiko and Narset, Unified": [
    { cardName: "Narset, Enlightened Exile", price: "$2", reason: "Casts spells from exile for free on attack", category: "synergy" },
    { cardName: "Hinata, Dawn-Crowned", price: "$2", reason: "Makes targeted spells cheaper, opponents' more expensive", category: "synergy" },
    { cardName: "Kykar, Zephyr Awakener", price: "$2", reason: "Creates Spirits on noncreature spells for tokens or mana", category: "synergy" },
    { cardName: "Archmage of Runes", price: "$1", reason: "High synergy spellslinger payoff", category: "synergy" },
    { cardName: "Jeska's Will", price: "$7", reason: "Explosive red mana from commander, impulse draw", category: "ramp" },
    { cardName: "Cyclonic Rift", price: "$25", reason: "One-sided bounce wipe, best blue removal in Commander", category: "removal" },
    { cardName: "Mystic Remora", price: "$3", reason: "Draws cards whenever opponents cast noncreature spells", category: "draw" },
    { cardName: "Teferi's Protection", price: "$8", reason: "Phases you out completely, total protection", category: "protection" },
  ],
  "Isperia, Supreme Judge": [
    { cardName: "Propaganda", price: "$3", reason: "Opponents must pay per attacking creature", category: "protection" },
    { cardName: "Reconnaissance Mission", price: "$1", reason: "Draw a card whenever a creature deals combat damage", category: "draw" },
    { cardName: "Gravitational Shift", price: "$2", reason: "Flyers get +2/+0, non-flyers get -2/-0", category: "synergy" },
    { cardName: "Windborn Muse", price: "$1", reason: "Flying + Ghostly Prison on a body", category: "protection" },
    { cardName: "Coastal Piracy", price: "$2", reason: "Same as Reconnaissance Mission, redundancy", category: "draw" },
    { cardName: "Empyrean Eagle", price: "$0.50", reason: "Lord that gives +1/+1 to flyers", category: "synergy" },
    { cardName: "Teferi's Ageless Insight", price: "$2", reason: "Double your card draws", category: "draw" },
    { cardName: "Render Silent", price: "$2", reason: "Counterspell that also prevents further casting", category: "removal" },
  ],
  "Dr. Madison Li": [
    { cardName: "Aetherworks Marvel", price: "$3", reason: "Spends energy to cheat big artifacts into play", category: "synergy" },
    { cardName: "Gonti's Aether Heart", price: "$2", reason: "Generates energy, can take an extra turn", category: "synergy" },
    { cardName: "Decoction Module", price: "$0.50", reason: "Energy on creature ETB, bounce for value", category: "synergy" },
    { cardName: "Whirler Virtuoso", price: "$0.25", reason: "Creates Thopters from energy", category: "synergy" },
    { cardName: "Shimmer of Possibility", price: "$0.25", reason: "Digs 4 deep for artifacts/energy pieces", category: "draw" },
    { cardName: "Cyberdrive Awakener", price: "$0.50", reason: "Turns all artifacts into 4/4 flyers", category: "synergy" },
    { cardName: "Padeem, Consul of Innovation", price: "$1", reason: "Gives artifacts hexproof, draws cards", category: "protection" },
    { cardName: "Emry, Lurker of the Loch", price: "$3", reason: "Recasts artifacts from graveyard", category: "synergy" },
  ],
};

/** Look up upgrade suggestions by commander name with fuzzy matching */
export function getUpgradeSuggestions(commanderName: string): UpgradeSuggestion[] {
  const lower = commanderName.toLowerCase();
  for (const [key, suggestions] of Object.entries(UPGRADE_SUGGESTIONS)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return suggestions;
    }
  }
  // Try partial match on first word
  const firstName = lower.split(",")[0].trim();
  for (const [key, suggestions] of Object.entries(UPGRADE_SUGGESTIONS)) {
    if (key.toLowerCase().startsWith(firstName)) {
      return suggestions;
    }
  }
  return [];
}
