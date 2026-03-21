export interface DeckGuide {
  overview: string;
  earlyGame: string;
  midGame: string;
  lateGame: string;
  keyCards: { name: string; tip: string }[];
  combos: { cards: string[]; explanation: string }[];
  tips: string[];
}

export const DECK_GUIDES: Record<string, DeckGuide> = {
  "Draconic Destruction": {
    overview:
      "A Gruul (Red/Green) dragon tribal deck led by Atarka, World Render. The game plan is simple but devastating: ramp early, reduce dragon costs with tribal synergies, then slam huge dragons that get double strike from Atarka.",
    earlyGame:
      "Turns 1-4 are all about ramping. Play mana dorks like Elvish Mystic, mana rocks like Sol Ring and Gruul Signet, and cost reducers like Dragonspeaker Shaman. Don't worry about the board yet — you're building toward explosive turns. A turn-2 Sol Ring into a turn-3 cost reducer is your dream start.",
    midGame:
      "Turns 5-8, start deploying your dragons. Prioritize dragons with enter-the-battlefield effects or those that generate value like Savage Ventmaw (mana on attack) and Dragon Tempest (haste + direct damage). If Atarka isn't out yet, use this time to set up the board with support enchantments like Crucible of Fire.",
    lateGame:
      "Once Atarka hits the field, every dragon becomes a lethal threat with double strike. Swing wide with multiple dragons — Dragon Tempest gives them haste so opponents can't react. Savage Ventmaw pays for more dragons on combat. If Atarka gets removed, recast from the command zone and keep the pressure on.",
    keyCards: [
      { name: "Atarka, World Render", tip: "Your commander gives ALL your attacking dragons double strike. This turns even a 4/4 dragon into 8 damage. Always attack with Atarka alongside other dragons." },
      { name: "Savage Ventmaw", tip: "Adds 6 mana (3R, 3G) when it attacks. With Atarka's double strike, that's functionally free dragons. Use the mana to cast more threats post-combat." },
      { name: "Dragon Tempest", tip: "Gives all your dragons haste AND deals damage to any target equal to the number of dragons you control whenever one enters. The haste alone makes this card incredible." },
      { name: "Crucible of Fire", tip: "All your dragons get +3/+3. Combined with Atarka's double strike, even a small 3/3 dragon deals 12 combat damage." },
      { name: "Dragonspeaker Shaman", tip: "Reduces the cost of dragon spells by 2. This stacks with other cost reducers, letting you cast 7-mana dragons for just 3-4 mana." },
      { name: "Thundermaw Hellkite", tip: "On entering, it taps all flying creatures your opponents control and deals 1 damage to each. Perfect for clearing blockers before your alpha strike." },
    ],
    combos: [
      { cards: ["Atarka, World Render", "Any Dragon"], explanation: "Every attacking dragon gets double strike from Atarka. A single 5/5 dragon deals 10 damage. Multiple dragons with double strike end games fast." },
      { cards: ["Savage Ventmaw", "Aggravated Assault"], explanation: "Savage Ventmaw generates 6 mana when attacking. Aggravated Assault costs 5 mana for an extra combat. Net +1 mana per cycle = infinite combat steps." },
      { cards: ["Dragon Tempest", "Multiple Dragons"], explanation: "Each dragon entering triggers Tempest's damage ability scaled to your dragon count. Playing 3 dragons in a turn with 5 dragons out deals 15+ direct damage." },
    ],
    tips: [
      "Don't cast Atarka until you have at least one other dragon ready to attack with her. She's much scarier leading a pack.",
      "Prioritize cost reducers over early threats. Getting Dragonspeaker Shaman out turn 3 is better than a random 4-drop.",
      "In multiplayer, spread your attacks early to avoid making one player desperate. Save your alpha strike for when you can eliminate someone.",
      "Keep 1-2 mana open when possible for interaction like Beast Within or Chaos Warp. All-in aggro loses to board wipes.",
    ],
  },

  "Grand Larceny": {
    overview:
      "A Sultai (Black/Green/Blue) theft deck led by Gonti, Canny Acquisitor. The strategy revolves around playing evasive creatures, dealing combat damage to opponents, and stealing their cards to use against them. You win with your opponents' own threats.",
    earlyGame:
      "Deploy cheap evasive creatures turns 1-3: creatures with flying, unblockable, or menace. Your goal is to start connecting with opponents as early as possible to fuel Gonti's theft triggers. Sol Ring into a turn-2 evasive creature is ideal. Don't waste removal early — save it for real threats.",
    midGame:
      "By turns 5-8, you should have Gonti or other theft effects online. Start stealing the best cards from opponents' libraries. Prioritize stealing ramp and card draw — these fuel your engine further. Use removal to clear blockers for your evasive creatures. Ohran Frostfang turns all your attackers into card draw.",
    lateGame:
      "You're now playing multiple opponents' cards against them. Villainous Wealth as a finisher can steal 10+ cards in one shot. Your late game is as strong as your opponents' decks. Keep stealing threats and turning the table — you have no ceiling because you're using the best cards from everyone.",
    keyCards: [
      { name: "Gonti, Canny Acquisitor", tip: "Your commander. Whenever a creature you control deals combat damage, you exile the top card of that player's library and can cast it. Evasion is key to triggering this consistently." },
      { name: "Thief of Sanity", tip: "A 2/2 flyer that lets you look at the top 3 cards of a damaged player's library and exile one to cast later. Flying makes it hard to block." },
      { name: "Fallen Shinobi", tip: "Has ninjutsu — swap an unblocked attacker for this, exile the top 2 cards of that opponent's library and cast them free. Huge tempo swing." },
      { name: "Villainous Wealth", tip: "X spell that exiles the top X cards of an opponent's library and lets you cast any number of them free. Your late-game haymaker. X=10 usually ends the game." },
      { name: "Ohran Frostfang", tip: "Gives all your attacking creatures deathtouch and 'whenever this deals combat damage to a player, draw a card.' Makes every creature terrifying." },
    ],
    combos: [
      { cards: ["Evasive Creatures", "Gonti, Canny Acquisitor"], explanation: "The core engine. Unblockable/flying creatures guarantee combat damage, which triggers Gonti's theft ability every combat." },
      { cards: ["Ohran Frostfang", "Wide Board"], explanation: "Frostfang gives deathtouch to all attackers (forcing bad blocks) and draws cards on every hit. With 4+ creatures, you'll draw your entire deck." },
      { cards: ["Fallen Shinobi", "Unblocked Creature"], explanation: "Ninjutsu replaces an unblocked attacker with Shinobi, who exiles and casts 2 cards for free. The returned creature can be replayed for ETB value." },
    ],
    tips: [
      "Remember: stolen cards use YOUR mana to cast, so you still need good mana fixing. Prioritize lands that produce any color.",
      "In multiplayer, steal from the player whose cards complement your current board state. Need removal? Steal from the control player.",
      "Don't overcommit to the board. This deck is a value engine, not an aggro deck. 3-4 evasive creatures is plenty.",
      "Ninjutsu is your best friend. Return ETB creatures to hand for Ninjutsu, then replay them for more value.",
    ],
  },

  "Hosts of Mordor": {
    overview:
      "A Grixis (Blue/Black/Red) graveyard and Amass deck led by Sauron, Lord of the Rings. Cast Sauron to amass a massive Orc Army, mill yourself for reanimation targets, and bring back devastating creatures from your graveyard. The Ring tempts you for additional evasion.",
    earlyGame:
      "Turns 1-4, focus on self-mill and setup. Play cards that fill your graveyard with big creatures: Faithless Looting, Stitcher's Supplier, mill effects. Play mana rocks to get Sauron out faster. An early The Ring tempts you trigger sets up your Ring-bearer for evasion later.",
    midGame:
      "Cast Sauron turns 5-7. His trigger amasses 5 Orcs, mills you for 5 (fuel for reanimation), and reanimates a creature from any graveyard. This is a massive three-for-one. Start recurring threats from graveyards. Saruman amasses more Orcs whenever you cast instants/sorceries.",
    lateGame:
      "Your graveyard is a second hand. Living Death swaps all creatures in graveyards with those on the battlefield — devastating after filling your graveyard. The Balrog of Moria and other big threats keep coming back. Your Orc Army token should be enormous from repeated amass triggers.",
    keyCards: [
      { name: "Sauron, Lord of the Rings", tip: "Does THREE things when cast: amass Orcs 5 (huge army token), mill 5 cards (reanimation fuel), and reanimate any creature from any graveyard. Re-casting from command zone is worth the tax." },
      { name: "Saruman of Many Colors", tip: "Amasses Orcs whenever you cast an instant or sorcery. In a spell-heavy deck, your army grows rapidly without any additional investment." },
      { name: "Living Death", tip: "Exiles all creatures on the battlefield, then returns all creatures from all graveyards. After filling your graveyard with big threats, this is usually game-winning." },
      { name: "The Balrog of Moria", tip: "A massive beater. When it dies, you amass Orcs equal to its power. With graveyard recursion, it keeps coming back and growing your army." },
      { name: "Faithless Looting", tip: "Draw 2, discard 2 for just 1 red mana. Gets your best reanimation targets into the graveyard early. Has flashback for a second use." },
    ],
    combos: [
      { cards: ["Sauron", "Self-Mill", "Reanimation"], explanation: "Sauron's mill 5 on cast fills the graveyard. His reanimation ability then brings back the best creature milled. Each recast repeats the cycle." },
      { cards: ["Living Death", "Full Graveyard"], explanation: "After milling heavily, Living Death brings back 5-10 creatures while wiping the board. Your opponents lose everything and you get a full army." },
      { cards: ["The Ring Tempts You", "Orc Army Token"], explanation: "Making your giant Orc Army token the Ring-bearer gives it skulk (hard to block) and loot triggers. A 10/10 unblockable army token ends games." },
    ],
    tips: [
      "Don't be afraid to mill yourself aggressively. Your graveyard IS your strategy — the more creatures there, the better.",
      "Keep track of commander tax. Sauron costs 6 initially, so budgeting 8 or 10 mana for recasts is important.",
      "Protect your Orc Army token. It represents dozens of amass triggers worth of investment. Use hexproof boots or regeneration.",
      "In multiplayer, reanimate from opponents' graveyards too. Sauron says 'any graveyard' — steal their best creatures.",
    ],
  },

  "Jeskai Striker": {
    overview:
      "A Jeskai (Blue/White/Red) spellslinger deck built around casting cheap instants and sorceries to trigger token creation and Prowess. The deck chains cantrips to create and buff an army of Monk and Elemental tokens, then overwhelms opponents with a massive Prowess-fueled attack.",
    earlyGame:
      "Turns 1-3, play token generators: Young Pyromancer, Monastery Mentor, or your commander. Then start casting cheap cantrips (Opt, Ponder, Brainstorm) to create tokens immediately. Even with just one token maker, 2-3 cheap spells create a dangerous board.",
    midGame:
      "Turns 4-7, your commander Shiko and Narset copies your second spell each turn. Use this to double your card draw or double your removal. Storm-Kiln Artist generates treasure tokens, fueling even more spells. Keep the cantrip chains flowing — each spell triggers Prowess on ALL your creatures.",
    lateGame:
      "Cast a big Mana Geyser for 10+ mana, then chain spells to trigger Prowess on your entire army. A board of 5 tokens each getting +5/+5 from Prowess is 50+ damage in one swing. Alternatively, use Archmage Emeritus to draw your entire deck and find a combo finish.",
    keyCards: [
      { name: "Monastery Mentor", tip: "Creates a 1/1 Monk token with Prowess whenever you cast a noncreature spell. Each subsequent spell pumps ALL Monks. 3 spells = 3 tokens + all get +3/+3." },
      { name: "Storm-Kiln Artist", tip: "Creates a Treasure token whenever you cast or copy an instant or sorcery. Basically turns every spell into a ritual, fueling more spells." },
      { name: "Young Pyromancer", tip: "Creates a 1/1 Elemental whenever you cast an instant or sorcery. No Prowess, but reliable token generation that stacks with Mentor." },
      { name: "Mana Geyser", tip: "Adds red mana equal to the number of tapped lands your opponents control. In a 4-player game, this easily generates 10+ mana for a massive spell chain turn." },
      { name: "Archmage Emeritus", tip: "Draw a card whenever you cast or copy an instant or sorcery. Turns every cantrip into 'draw 2 cards,' keeping the spell chain going indefinitely." },
    ],
    combos: [
      { cards: ["Cheap Cantrips", "Monastery Mentor"], explanation: "Each 1-mana cantrip (Opt, Brainstorm, etc.) creates a Monk and triggers Prowess on all Monks. 5 cantrips = 5 Monks, each at 6/6." },
      { cards: ["Shiko and Narset", "Targeted Spell"], explanation: "Your commander copies the second spell you cast each turn if it targets. Double your card draw, double your removal, double your pump spells." },
      { cards: ["Mana Geyser", "Storm-Kiln Artist", "Spell Chain"], explanation: "Mana Geyser fuels a massive turn. Storm-Kiln gives treasure per spell. Chain 10+ spells to trigger Prowess, create tokens, and draw cards." },
    ],
    tips: [
      "Don't cast your cantrips just because you can. Save them for turns when you have token generators out to maximize value.",
      "Your second spell each turn gets copied by your commander. Sequence carefully — cast a setup spell first, then the spell you want copied.",
      "Prowess triggers on EVERY noncreature spell, not just instants/sorceries. Enchantments and artifacts count too.",
      "Keep at least 1-2 counterspells in hand. Your army is vulnerable to board wipes — one well-timed Negate saves the game.",
    ],
  },
};

/** Look up a guide by deck name. Tries exact match first, then partial match. */
export function getDeckGuide(deckName: string): DeckGuide | null {
  // Exact match
  if (DECK_GUIDES[deckName]) return DECK_GUIDES[deckName];
  // Partial match — deck name contains or is contained by a key
  const lower = deckName.toLowerCase();
  for (const [key, guide] of Object.entries(DECK_GUIDES)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return guide;
    }
  }
  return null;
}
