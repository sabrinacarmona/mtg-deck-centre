import { useState } from "react";
import {
  GraduationCap,
  Search,
  Swords,
  Palette,
  Shield,
  BookOpen,
  Zap,
  Gem,
  Crosshair,
  Eye,
  ShieldCheck,
  Sparkles,
  Target,
  Wrench,
  Globe,
  Lightbulb,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ManaSymbol } from "@/components/ManaSymbols";

/* ─── Keyword data, grouped by category ──────────────────────────── */

interface Keyword {
  name: string;
  reminder: string;
}

interface KeywordCategory {
  label: string;
  icon: React.ReactNode;
  keywords: Keyword[];
}

const keywordCategories: KeywordCategory[] = [
  {
    label: "Evergreen",
    icon: <Zap className="w-3.5 h-3.5 text-primary" />,
    keywords: [
      { name: "Deathtouch", reminder: "Any amount of damage this deals to a creature is enough to destroy it." },
      { name: "Defender", reminder: "This creature can't attack." },
      { name: "Flash", reminder: "You may cast this spell any time you could cast an instant." },
      { name: "Haste", reminder: "This creature can attack and {T} as soon as it comes under your control." },
      { name: "Hexproof", reminder: "This permanent can't be the target of spells or abilities your opponents control." },
      { name: "Indestructible", reminder: "Effects that say \"destroy\" don't destroy this permanent. Lethal damage doesn't destroy it either." },
      { name: "Lifelink", reminder: "Damage dealt by this creature also causes you to gain that much life." },
      { name: "Reach", reminder: "This creature can block creatures with flying." },
      { name: "Trample", reminder: "This creature can deal excess combat damage to the player or planeswalker it's attacking." },
      { name: "Vigilance", reminder: "Attacking doesn't cause this creature to tap." },
      { name: "Ward", reminder: "Whenever this permanent becomes the target of a spell or ability an opponent controls, counter it unless they pay the ward cost." },
    ],
  },
  {
    label: "Combat",
    icon: <Swords className="w-3.5 h-3.5 text-primary" />,
    keywords: [
      { name: "Double strike", reminder: "This creature deals both first-strike and regular combat damage." },
      { name: "First strike", reminder: "This creature deals combat damage before creatures without first strike." },
      { name: "Menace", reminder: "This creature can't be blocked except by two or more creatures." },
      { name: "Prowess", reminder: "Whenever you cast a noncreature spell, this creature gets +1/+1 until end of turn." },
      { name: "Annihilator", reminder: "Whenever this creature attacks, defending player sacrifices that many permanents." },
    ],
  },
  {
    label: "Evasion",
    icon: <Eye className="w-3.5 h-3.5 text-primary" />,
    keywords: [
      { name: "Flying", reminder: "This creature can't be blocked except by creatures with flying or reach." },
      { name: "Skulk", reminder: "This creature can't be blocked by creatures with greater power." },
      { name: "Ninjutsu", reminder: "Pay the ninjutsu cost, return an unblocked attacker you control to hand: Put this card onto the battlefield tapped and attacking." },
    ],
  },
  {
    label: "Protection",
    icon: <ShieldCheck className="w-3.5 h-3.5 text-primary" />,
    keywords: [
      { name: "Shroud", reminder: "This permanent can't be the target of spells or abilities — including your own." },
      { name: "Protection", reminder: "A creature with protection from [quality] can't be damaged, enchanted/equipped, blocked, or targeted by sources of that quality (\"DEBT\")." },
    ],
  },
  {
    label: "Spells & Abilities",
    icon: <Sparkles className="w-3.5 h-3.5 text-primary" />,
    keywords: [
      { name: "Cascade", reminder: "When you cast this spell, exile cards from the top of your library until you exile a nonland card that costs less. You may cast it without paying its mana cost." },
      { name: "Convoke", reminder: "Your creatures can help cast this spell. Each creature you tap while casting this spell pays for {1} or one mana of that creature's color." },
      { name: "Equip", reminder: "Attach this Equipment to target creature you control. Equip only as a sorcery." },
      { name: "Mill", reminder: "To mill N, a player puts the top N cards of their library into their graveyard." },
      { name: "Scry", reminder: "Look at the top N cards of your library, then put any number of them on the bottom in any order and the rest on top in any order." },
      { name: "Storm", reminder: "When you cast this spell, copy it for each spell cast before it this turn." },
    ],
  },
  {
    label: "Deck-Specific",
    icon: <Crosshair className="w-3.5 h-3.5 text-primary" />,
    keywords: [
      { name: "Amass Orcs", reminder: "Put +1/+1 counters on an Army you control. If you don't control one, create a 0/0 black Orc Army creature token first." },
      { name: "The Ring Tempts You", reminder: "Choose a creature as your Ring-bearer. As the Ring tempts you more, it gains: skulk, looting on damage, \"blocking creatures don't untap,\" and drain on damage." },
      { name: "Flurry", reminder: "The second spell you cast each turn triggers a copy. Found on Jeskai spellslinger commanders like Shiko and Narset." },
      { name: "Commander", reminder: "Your legendary creature that leads your deck. It starts in the command zone and costs {2} more each time you recast it (the \"commander tax\")." },
      { name: "Token", reminder: "A creature or permanent created by a spell or ability. Tokens cease to exist when they leave the battlefield." },
    ],
  },
];

const allKeywords = keywordCategories.flatMap((c) => c.keywords);

/* ─── Color data ─────────────────────────────────────────────────── */

const colors: {
  code: string;
  name: string;
  land: string;
  philosophy: string;
  strengths: string;
}[] = [
  {
    code: "W",
    name: "White",
    land: "Plains",
    philosophy: "Order, law, and community",
    strengths: "Life gain, small-creature armies, board wipes, enchantment-based removal, protection",
  },
  {
    code: "U",
    name: "Blue",
    land: "Island",
    philosophy: "Knowledge, patience, and control",
    strengths: "Counterspells, card draw, bounce, flying creatures, copying and stealing",
  },
  {
    code: "B",
    name: "Black",
    land: "Swamp",
    philosophy: "Power at any cost",
    strengths: "Creature destruction, discard, graveyard recursion, sacrifice synergies, paying life for advantage",
  },
  {
    code: "R",
    name: "Red",
    land: "Mountain",
    philosophy: "Freedom, emotion, and chaos",
    strengths: "Direct damage (burn), haste, impulsive draw, artifact destruction, aggressive creatures",
  },
  {
    code: "G",
    name: "Green",
    land: "Forest",
    philosophy: "Nature, growth, and raw power",
    strengths: "Mana ramp, massive creatures, trample, enchantment/artifact removal, fighting",
  },
];

/* ─── Component ──────────────────────────────────────────────────── */

export default function LearnPage() {
  const [keywordSearch, setKeywordSearch] = useState("");

  const filteredCategories = keywordCategories
    .map((cat) => ({
      ...cat,
      keywords: cat.keywords.filter(
        (kw) =>
          kw.name.toLowerCase().includes(keywordSearch.toLowerCase()) ||
          kw.reminder.toLowerCase().includes(keywordSearch.toLowerCase())
      ),
    }))
    .filter((cat) => cat.keywords.length > 0);

  return (
    <div className="space-y-6" data-testid="learn-page">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold">Learn Magic</h1>
          <p className="text-xs text-muted-foreground">
            Rules, keywords, and strategy reference
          </p>
        </div>
      </div>

      <Accordion type="multiple" className="space-y-3">
        {/* ── Section 1: How to Play ──────────────────────────── */}
        <AccordionItem value="basics" className="card-frame overflow-hidden border-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <Swords className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">How to Play</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4 text-sm text-foreground/80">
              <div>
                <h4 className="font-semibold text-primary mb-1">Objective</h4>
                <p>
                  Reduce your opponents from 20 life to 0 (40 in Commander).
                  You can also win if an opponent draws from an empty library, gets 10 poison counters, or a card says "you win."
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-primary mb-1">Turn Structure</h4>
                <p className="mb-2">Each turn follows these phases in order:</p>
                <div className="space-y-1.5">
                  {[
                    ["1", "Beginning Phase", "Untap all your permanents, resolve upkeep triggers, draw a card."],
                    ["2", "Main Phase 1", "Play a land (one per turn), cast creatures, sorceries, enchantments, artifacts, planeswalkers."],
                    ["3", "Combat Phase", "Declare attackers (tap them), opponent declares blockers, combat damage is dealt simultaneously."],
                    ["4", "Main Phase 2", "Same as Main Phase 1. Cast creatures after combat so opponents can't plan blocks around them."],
                    ["5", "End Phase", "End-step triggers resolve, discard to hand size (7), damage wears off creatures."],
                  ].map(([num, title, desc]) => (
                    <div key={num} className="flex items-start gap-2">
                      <span className="text-xs bg-primary/15 text-primary px-1.5 py-0.5 rounded font-medium shrink-0">
                        {num}
                      </span>
                      <div>
                        <strong>{title}</strong> — {desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-primary mb-1">Key Rules</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>You can play one land per turn — lands produce mana to cast spells.</li>
                  <li>Creatures have "summoning sickness" — they can't attack or use tap abilities the turn they enter.</li>
                  <li>Instants can be cast at any time, even during your opponent's turn.</li>
                  <li>Sorceries can only be cast during your main phase when the stack is empty.</li>
                </ul>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── Section 2: Card Types ───────────────────────────── */}
        <AccordionItem value="card-types" className="card-frame overflow-hidden border-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Card Types</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-3 text-sm text-foreground/80">
              {[
                ["Land", "Produces mana. You play one per turn at no cost. Basic lands: Plains, Island, Swamp, Mountain, Forest."],
                ["Creature", "Has power/toughness (e.g. 6/4). Attacks opponents and blocks attackers. Has summoning sickness the turn it enters."],
                ["Instant", "Cast at any time — your turn, opponent's turn, during combat. Goes to graveyard after resolving."],
                ["Sorcery", "Cast only during your main phase when the stack is empty. Usually stronger effects to offset the timing restriction."],
                ["Enchantment", "Stays on the battlefield providing ongoing effects. Auras attach to a specific permanent."],
                ["Artifact", "Colorless permanents providing utility. Equipment attaches to creatures. Mana rocks accelerate your mana."],
                ["Planeswalker", "Enters with loyalty counters. Activate one loyalty ability per turn (+/-). Opponents can attack it directly."],
              ].map(([type, desc]) => (
                <div key={type} className="border-l-2 border-primary/30 pl-3">
                  <h4 className="font-semibold">{type}</h4>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── Section 3: Mana & Colors (with SVG symbols) ─────── */}
        <AccordionItem value="mana-colors" className="card-frame overflow-hidden border-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Mana & Colors</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4 text-sm text-foreground/80">
              <p>
                Magic has five colors of mana. Each has a distinct philosophy, strengths, and weaknesses.
                Decks can be one color, two colors (guilds), three (shards/wedges), or even all five.
              </p>

              <div className="space-y-3">
                {colors.map((c) => (
                  <div
                    key={c.code}
                    className="flex items-start gap-3 rounded-lg bg-card/60 p-3 border border-border/40"
                  >
                    <ManaSymbol symbol={c.code} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold">{c.name}</span>
                        <span className="text-xs text-muted-foreground">({c.land})</span>
                      </div>
                      <p className="text-xs text-primary/80 italic mb-1">{c.philosophy}</p>
                      <p className="text-xs text-muted-foreground">{c.strengths}</p>
                    </div>
                  </div>
                ))}

                {/* Colorless */}
                <div className="flex items-start gap-3 rounded-lg bg-card/60 p-3 border border-border/40">
                  <ManaSymbol symbol="C" size="lg" />
                  <div className="flex-1 min-w-0">
                    <span className="font-bold">Colorless</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Any color of mana can pay generic costs (numbers like{" "}
                      <ManaSymbol symbol="2" size="sm" /> or{" "}
                      <ManaSymbol symbol="3" size="sm" />
                      ). Artifacts often have generic costs, making them playable in any deck.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-primary mb-1">Multi-Color & Color Identity</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>
                    Multi-color cards require mana of each color — e.g. a{" "}
                    <ManaSymbol symbol="R" size="sm" />
                    <ManaSymbol symbol="G" size="sm" />{" "}
                    card needs both red and green mana.
                  </li>
                  <li>In Commander, your deck can only include cards matching your commander's color identity.</li>
                  <li>Color identity includes mana symbols in the cost AND rules text.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-primary mb-1">Common Mana Costs</h4>
                <div className="flex flex-wrap gap-3 text-xs">
                  <span className="inline-flex items-center gap-1">
                    <ManaSymbol symbol="1" size="sm" />
                    <ManaSymbol symbol="R" size="sm" />
                    = 2 mana (1 any + 1 red)
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ManaSymbol symbol="2" size="sm" />
                    <ManaSymbol symbol="U" size="sm" />
                    <ManaSymbol symbol="U" size="sm" />
                    = 4 mana (2 any + 2 blue)
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ManaSymbol symbol="W" size="sm" />
                    <ManaSymbol symbol="B" size="sm" />
                    = 2 mana (1 white + 1 black)
                  </span>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── Section 4: Commander Format ──────────────────────── */}
        <AccordionItem value="commander" className="card-frame overflow-hidden border-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Commander Format</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-3 text-sm text-foreground/80">
              <p>
                Commander (EDH) is the most popular casual format — designed for multiplayer free-for-all
                games with 3-4 players.
              </p>

              <div className="space-y-2">
                {[
                  ["100", "Singleton deck", "Exactly 100 cards including your commander. Only 1 copy of each card (except basic lands)."],
                  ["40", "Starting life", "Each player starts at 40 life instead of 20."],
                  ["21", "Commander damage", "If one commander deals 21+ combat damage to a player, that player loses regardless of life total."],
                ].map(([num, title, desc]) => (
                  <div key={num} className="flex items-start gap-2">
                    <span className="text-xs bg-primary/15 text-primary px-1.5 py-0.5 rounded font-bold shrink-0">
                      {num}
                    </span>
                    <p>
                      <strong>{title}</strong> — {desc}
                    </p>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="font-semibold text-primary mb-1">The Command Zone</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Your commander starts in the command zone, not your library.</li>
                  <li>Cast it by paying its mana cost.</li>
                  <li>
                    Each recast costs an additional <ManaSymbol symbol="2" size="sm" /> (the "commander tax").
                  </li>
                  <li>When your commander would go to graveyard or exile, you may return it to the command zone.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-primary mb-1">Color Identity</h4>
                <p>
                  Every card must match your commander's color identity. A{" "}
                  <span className="inline-flex items-center gap-0.5">
                    <ManaSymbol symbol="R" size="sm" />
                    <ManaSymbol symbol="G" size="sm" />
                  </span>{" "}
                  (Gruul) commander means only red, green, and colorless cards.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-primary mb-1">Multiplayer Politics</h4>
                <p>
                  Making deals, forming temporary alliances, and choosing when to strike are key skills.
                  Don't become the archenemy too early!
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── Section 5: Keywords (grouped by category) ────────── */}
        <AccordionItem value="keywords" className="card-frame overflow-hidden border-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">
                Keywords & Abilities ({allKeywords.length})
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              {/* Search filter */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Filter keywords..."
                  value={keywordSearch}
                  onChange={(e) => setKeywordSearch(e.target.value)}
                  className="pl-9 h-8 text-xs bg-card border-border"
                />
              </div>

              {/* Grouped keywords */}
              <div className="space-y-4">
                {filteredCategories.map((cat) => (
                  <div key={cat.label}>
                    <div className="flex items-center gap-1.5 mb-2">
                      {cat.icon}
                      <h4 className="text-xs font-bold uppercase tracking-wider text-primary/80">
                        {cat.label}
                      </h4>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {cat.keywords.length}
                      </span>
                    </div>
                    <div className="space-y-1 pl-1">
                      {cat.keywords.map((kw) => (
                        <div
                          key={kw.name}
                          className="flex items-start gap-2 text-sm py-1.5 border-b border-border/30 last:border-0"
                        >
                          <span className="font-semibold text-foreground shrink-0 min-w-[110px]">
                            {kw.name}
                          </span>
                          <span className="text-foreground/60 text-xs leading-relaxed">
                            {kw.reminder}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {filteredCategories.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No keywords match "{keywordSearch}"
                  </p>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── Section 6: Common Actions ────────────────────────── */}
        <AccordionItem value="actions" className="card-frame overflow-hidden border-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <Gem className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Actions, Stack & Priority</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-3 text-sm text-foreground/80">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  ["Tap / Untap", "Turn a card sideways to use it (attacking, abilities, mana). It untaps at the start of your next turn."],
                  ["Cast", "Play a spell by paying its mana cost. It goes on the stack and opponents can respond."],
                  ["Sacrifice", "Send your own permanent to the graveyard as a cost. Can't be prevented."],
                  ["Exile", "Remove from the game entirely. Much harder to get back than the graveyard."],
                  ["Destroy", "Send to the graveyard. Indestructible permanents survive."],
                  ["Counter", "Cancel a spell on the stack before it resolves. Only works on spells, not abilities."],
                ].map(([title, desc]) => (
                  <div key={title} className="space-y-0.5">
                    <h4 className="font-semibold">{title}</h4>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-border/50 pt-3 space-y-3">
                <div>
                  <h4 className="font-semibold text-primary mb-1">The Stack</h4>
                  <p>
                    Spells and abilities go on the stack. Each player can respond.
                    The stack resolves last-in-first-out: the last thing added resolves first.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-primary mb-1">Priority</h4>
                  <p>
                    The active player gets priority first. After acting or passing, each opponent gets a chance.
                    When all pass, the top stack item resolves.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-primary mb-1">Mulligan</h4>
                  <p>
                    Don't like your opening hand? Shuffle it back and draw 7 again.
                    In Commander, the first mulligan is free. After that, put 1 card on the bottom per mulligan.
                  </p>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        {/* ── Section 7: Strategy Archetypes ──────────────────── */}
        <AccordionItem value="archetypes" className="card-frame overflow-hidden border-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Strategy Archetypes</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4 text-sm text-foreground/80">
              <p>Every deck falls into one of three broad strategic archetypes. Understanding these helps you know what your deck is trying to do — and what your opponent is up to.</p>
              <div className="space-y-3">
                {[
                  ["Aggro", "R", "Win fast. Flood the board with cheap, aggressive creatures and burn spells. Aim to close out before your opponent stabilises. Weakness: runs out of cards if the game goes long.", "Your Draconic Destruction deck leans aggro — ramp fast, slam dragons, attack."],
                  ["Control", "U", "Win late. Use counterspells, removal, and card draw to answer every threat. Eventually win with a single powerful finisher. Weakness: slow starts and vulnerable to explosive aggro.", "Will's First Flight has control elements — Counterspell, Negate, and Isperia drawing cards."],
                  ["Midrange", "B", "Win on value. Play efficient threats that are individually powerful. Can pivot between aggro and control depending on the matchup. The flexible middle ground.", "Most Wanted is midrange — committing crimes, generating Treasures, and overwhelming with Outlaws."],
                ].map(([name, mana, desc, example]) => (
                  <div key={name} className="rounded-lg bg-card/60 p-3 border border-border/40">
                    <div className="flex items-center gap-2 mb-1">
                      <ManaSymbol symbol={mana} size={18} />
                      <span className="font-bold">{name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                    <p className="text-xs text-primary/70 mt-1 italic">{example}</p>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-1">The Rock-Paper-Scissors</h4>
                <p>Generally: Aggro beats Control (too fast to answer), Control beats Midrange (too much removal), Midrange beats Aggro (bigger creatures). This isn't absolute, but it's a useful mental model.</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── Section 8: Deckbuilding Basics ────────────────────── */}
        <AccordionItem value="deckbuilding" className="card-frame overflow-hidden border-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Deckbuilding Basics</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4 text-sm text-foreground/80">
              <div>
                <h4 className="font-semibold text-primary mb-1">60-Card Deck Framework</h4>
                <p className="mb-2">For a standard 60-card deck:</p>
                <div className="space-y-1.5">
                  {[
                    ["24", "Lands", "Ensures you hit land drops consistently. The #1 reason beginners lose is not enough lands."],
                    ["36", "Non-land spells", "Follow the 'Rule of Nine': pick 9 different cards you want, run 4 copies of each."],
                    ["1–2", "Colors", "Stick to 1-2 colors to avoid mana problems. Multi-color mana bases need expensive dual lands."],
                  ].map(([num, title, desc]) => (
                    <div key={num} className="flex items-start gap-2">
                      <span className="text-xs bg-primary/15 text-primary px-1.5 py-0.5 rounded font-bold shrink-0">
                        {num}
                      </span>
                      <p><strong>{title}</strong> — {desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-primary mb-1">Commander Deckbuilding</h4>
                <p className="mb-2">For a 100-card Commander deck, the typical split is:</p>
                <div className="space-y-1.5">
                  {[
                    ["36–38", "Lands", "Commander games go long — you need consistent mana. Include 2-3 utility lands (Command Tower, Path of Ancestry)."],
                    ["10", "Ramp", "Sol Ring, signets, talismans, Cultivate. Getting ahead on mana wins Commander games."],
                    ["10", "Card draw", "You need to refuel. Enchantments like Elemental Bond, instants like Harmonize."],
                    ["8–10", "Removal", "Single-target (Swords to Plowshares) and board wipes (Cleansing Nova). Always pack some."],
                    ["30+", "Your strategy", "The fun stuff — creatures, combos, synergy pieces that make your deck do its thing."],
                  ].map(([num, title, desc]) => (
                    <div key={num} className="flex items-start gap-2">
                      <span className="text-xs bg-primary/15 text-primary px-1.5 py-0.5 rounded font-bold shrink-0">
                        {num}
                      </span>
                      <p><strong>{title}</strong> — {desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-primary mb-1">Mana Curve</h4>
                <p>
                  Your mana curve is the distribution of cards by mana cost. A good curve means you have something to play every turn. Too many expensive cards = doing nothing early. Too many cheap cards = running out of gas late. In Commander, aim for a curve peaking at 3-4 mana.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-primary mb-1">Win Condition</h4>
                <p>
                  Every deck needs a clear win condition — know what your deck is trying to do.
                  Is it attacking with big creatures? Comboing off? Draining life?
                  If you can't answer "how does this deck win?", the deck needs work.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── Section 9: Formats Overview ───────────────────────── */}
        <AccordionItem value="formats" className="card-frame overflow-hidden border-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Formats Overview</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4 text-sm text-foreground/80">
              <p>Magic has many ways to play. Formats control which cards are legal and how decks are built.</p>

              <div>
                <h4 className="font-semibold text-primary mb-2">Constructed Formats</h4>
                <div className="space-y-2">
                  {[
                    ["Commander (EDH)", "100 cards, singleton, 40 life", "The most popular format globally. Social, casual, multiplayer. This is what you play!"],
                    ["Standard", "60+ cards, last ~3 years of sets", "Rotates annually. The default competitive format on MTG Arena."],
                    ["Modern", "60+ cards, sets from 2003+", "Huge non-rotating card pool. Powerful and diverse."],
                    ["Pioneer", "60+ cards, sets from 2012+", "Non-rotating, newer card pool than Modern."],
                    ["Pauper", "60+ cards, commons only", "Budget-friendly. Proves great gameplay doesn't need expensive cards."],
                  ].map(([name, size, desc]) => (
                    <div key={name} className="border-l-2 border-primary/30 pl-3">
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold">{name}</span>
                        <span className="text-[10px] text-muted-foreground">{size}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-primary mb-2">Limited Formats</h4>
                <div className="space-y-2">
                  {[
                    ["Sealed", "Open 6 packs, build a 40-card deck from them. Great for prereleases and casual events."],
                    ["Draft", "Sit in a circle, open packs, pick one card and pass. Builds skill fast — you learn to evaluate cards on the fly."],
                  ].map(([name, desc]) => (
                    <div key={name} className="border-l-2 border-primary/30 pl-3">
                      <span className="font-semibold">{name}</span>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-primary mb-1">Universes Beyond</h4>
                <p>
                  Since 2021, Magic has released crossover sets featuring other franchises. Your Hosts of Mordor deck is from The Lord of the Rings set, and Will's Science! deck is from the Fallout set. Starting in 2025, Universes Beyond sets are Standard-legal. Upcoming: Marvel Super Heroes and Star Trek.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── Section 10: Pro Tips ──────────────────────────────── */}
        <AccordionItem value="tips" className="card-frame overflow-hidden border-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Pro Tips for New Players</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-3 text-sm text-foreground/80">
              <div className="space-y-2">
                {[
                  ["Don't buy packs to build decks", "The odds of getting what you need are poor. Buy specific single cards from TCGPlayer, Card Kingdom, or Cardmarket instead. Packs are for drafting and fun."],
                  ["Goldfish your decks", "Draw practice hands and play several turns against an imaginary opponent. It's the fastest way to learn whether your deck works. (You can do this in the Goldfish tab!)"],
                  ["Don't overextend", "Dumping your whole hand onto the board feels great until your opponent plays a board wipe. Keep 1-2 threats in reserve."],
                  ["Read your opponents' mana", "If they have 2 blue mana untapped, they probably have a counterspell. If they have white mana up, watch for removal. Play around what they might have."],
                  ["Removal is always worth including", "Even if your deck has a clear theme, always run 8-10 removal spells. You need answers to what opponents are doing."],
                  ["Don't become the archenemy", "In Commander, the biggest threat gets attacked by everyone. Stay under the radar early, then strike when you're ready."],
                  ["Lands win games", "The #1 reason newer players lose is bad mana. Run enough lands. Hit your land drops. Mana screw isn't bad luck — it's bad deckbuilding."],
                  ["Have a plan for each matchup", "Before each game against Will, think: how does my deck beat his? Am I faster? Do I go wide? Can I remove his key pieces? Check the Rivals tab for specific counter-strategies."],
                ].map(([title, desc], i) => (
                  <div key={i} className="rounded-lg bg-card/60 p-3 border border-border/40">
                    <h4 className="font-semibold text-xs text-primary mb-0.5">{title}</h4>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
