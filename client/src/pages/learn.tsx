import { useState } from "react";
import { GraduationCap, Search, Swords, Gem, Palette, Shield, BookOpen, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const keywords: { name: string; description: string }[] = [
  { name: "Annihilator", description: "When this creature attacks, defending player sacrifices that many permanents." },
  { name: "Amass", description: "Put +1/+1 counters on your Army token (or create a 0/0 Army first). Amass Orcs creates Orc Army tokens." },
  { name: "Cascade", description: "When you cast this spell, exile cards from the top of your library until you exile a nonland card that costs less. You may cast it free." },
  { name: "Commander", description: "Your legendary creature that leads your deck. Starts in the command zone, costs 2 more each recast." },
  { name: "Convoke", description: "Your creatures can help cast this spell. Each creature you tap pays for 1 or one mana of that creature's color." },
  { name: "Counter (spell)", description: "Cancel a spell on the stack before it resolves. The spell goes to the graveyard without effect." },
  { name: "Deathtouch", description: "Any amount of damage this deals to a creature is enough to destroy it." },
  { name: "Defender", description: "This creature can't attack. It can still block." },
  { name: "Double strike", description: "This creature deals both first-strike and regular combat damage — effectively hitting twice." },
  { name: "Enchant", description: "An Aura keyword that specifies what the Aura can be attached to (e.g., Enchant creature)." },
  { name: "Equip", description: "Pay the equip cost to attach an Equipment artifact to a creature you control." },
  { name: "First strike", description: "This creature deals combat damage before creatures without first strike." },
  { name: "Flash", description: "You may cast this spell any time you could cast an instant." },
  { name: "Flying", description: "This creature can only be blocked by creatures with flying or reach." },
  { name: "Flurry", description: "The second spell you cast each turn triggers a copy effect. Found on Jeskai commanders." },
  { name: "Haste", description: "This creature can attack and tap the turn it enters the battlefield. Ignores summoning sickness." },
  { name: "Hexproof", description: "This permanent can't be the target of spells or abilities your opponents control." },
  { name: "Indestructible", description: "Damage and effects that say 'destroy' don't destroy this permanent. Can still be exiled or sacrificed." },
  { name: "Lifelink", description: "Damage dealt by this creature also causes you to gain that much life." },
  { name: "Menace", description: "This creature can't be blocked except by two or more creatures." },
  { name: "Mill", description: "Put that many cards from the top of a player's library into their graveyard." },
  { name: "Ninjutsu", description: "Pay the cost, return an unblocked attacker to hand: put this creature from hand onto the battlefield attacking." },
  { name: "Prowess", description: "Whenever you cast a noncreature spell, this creature gets +1/+1 until end of turn." },
  { name: "Reach", description: "This creature can block creatures with flying." },
  { name: "Scry", description: "Look at the top N cards of your library, put any on the bottom in any order, rest on top in any order." },
  { name: "Shroud", description: "This permanent can't be the target of spells or abilities — including your own." },
  { name: "Storm", description: "When you cast this spell, copy it for each spell cast before it this turn." },
  { name: "The Ring Tempts You", description: "Choose a creature as your Ring-bearer. It gains abilities as the Ring tempts you more times (skulk, looting, deathtouch to blockers, drain)." },
  { name: "Token", description: "A creature or permanent created by a spell or ability. Not a real card — it ceases to exist when it leaves the battlefield." },
  { name: "Trample", description: "If this creature's damage exceeds the blocking creature's toughness, the rest carries over to the defending player." },
  { name: "Vigilance", description: "Attacking doesn't cause this creature to tap. It can still block on the opponent's turn." },
  { name: "Ward", description: "Whenever this permanent becomes the target of a spell or ability an opponent controls, counter it unless they pay the ward cost." },
];

export default function LearnPage() {
  const [keywordSearch, setKeywordSearch] = useState("");

  const filteredKeywords = keywords.filter(
    (kw) =>
      kw.name.toLowerCase().includes(keywordSearch.toLowerCase()) ||
      kw.description.toLowerCase().includes(keywordSearch.toLowerCase())
  );

  return (
    <div className="space-y-6" data-testid="learn-page">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Learn Magic</h1>
          <p className="text-xs text-muted-foreground">Rules, keywords, and strategy reference</p>
        </div>
      </div>

      <Accordion type="multiple" className="space-y-3">
        {/* Section 1: How to Play */}
        <AccordionItem value="basics" className="card-frame overflow-hidden border-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <Swords className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">How to Play (Basics)</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4 text-sm text-foreground/80">
              <div>
                <h4 className="font-semibold text-primary mb-1">Objective</h4>
                <p>Reduce your opponents from 20 life to 0 (40 life in Commander format). You can also win if an opponent has to draw from an empty library, gets 10 poison counters, or through certain card effects.</p>
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-1">Turn Structure</h4>
                <p className="mb-2">Each turn follows these phases in order:</p>
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span className="text-xs bg-primary/15 text-primary px-1.5 py-0.5 rounded font-medium shrink-0">1</span>
                    <div><strong>Beginning Phase</strong> — Untap all your permanents, resolve upkeep triggers, draw a card.</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xs bg-primary/15 text-primary px-1.5 py-0.5 rounded font-medium shrink-0">2</span>
                    <div><strong>Main Phase 1</strong> — Play a land (one per turn), cast creatures, sorceries, enchantments, artifacts, planeswalkers.</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xs bg-primary/15 text-primary px-1.5 py-0.5 rounded font-medium shrink-0">3</span>
                    <div><strong>Combat Phase</strong> — Declare attackers (tap them), opponent declares blockers, combat damage is dealt simultaneously.</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xs bg-primary/15 text-primary px-1.5 py-0.5 rounded font-medium shrink-0">4</span>
                    <div><strong>Main Phase 2</strong> — Same as Main Phase 1. Good for casting creatures after combat so opponents don't know your plans.</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xs bg-primary/15 text-primary px-1.5 py-0.5 rounded font-medium shrink-0">5</span>
                    <div><strong>End Phase</strong> — End step triggers resolve, discard down to 7 cards if needed, damage wears off creatures.</div>
                  </div>
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

        {/* Section 2: Card Types */}
        <AccordionItem value="card-types" className="card-frame overflow-hidden border-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Card Types</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-3 text-sm text-foreground/80">
              <div className="border-l-2 border-primary/30 pl-3">
                <h4 className="font-semibold">Land</h4>
                <p>Produces mana. You can play one per turn. Doesn't cost mana to play. Basic lands: Plains (W), Island (U), Swamp (B), Mountain (R), Forest (G). Lands are the foundation of every deck.</p>
              </div>
              <div className="border-l-2 border-primary/30 pl-3">
                <h4 className="font-semibold">Creature</h4>
                <p>Has power and toughness (e.g., 6/4 means 6 power, 4 toughness). Can attack opponents and block attackers. Has summoning sickness — can't attack or tap the turn it enters. Your main way to deal damage.</p>
              </div>
              <div className="border-l-2 border-primary/30 pl-3">
                <h4 className="font-semibold">Instant</h4>
                <p>Can be cast at any time — during your turn, your opponent's turn, even during combat. Goes to the graveyard after resolving. Great for surprise plays and responding to threats.</p>
              </div>
              <div className="border-l-2 border-primary/30 pl-3">
                <h4 className="font-semibold">Sorcery</h4>
                <p>Like an instant, but can only be cast during your main phase when the stack is empty. Usually more powerful effects to compensate for the timing restriction.</p>
              </div>
              <div className="border-l-2 border-primary/30 pl-3">
                <h4 className="font-semibold">Enchantment</h4>
                <p>Stays on the battlefield and provides ongoing effects. Auras are enchantments that attach to a specific permanent (creature, land, etc.).</p>
              </div>
              <div className="border-l-2 border-primary/30 pl-3">
                <h4 className="font-semibold">Artifact</h4>
                <p>Colorless permanent that provides utility. Equipment artifacts can be attached to creatures to boost their stats. Mana artifacts help you ramp faster.</p>
              </div>
              <div className="border-l-2 border-primary/30 pl-3">
                <h4 className="font-semibold">Planeswalker</h4>
                <p>Enters with loyalty counters. You can activate one loyalty ability per turn (+ adds counters, - removes them). Opponents can attack planeswalkers directly. When loyalty hits 0, it dies.</p>
              </div>
              <div className="border-l-2 border-primary/30 pl-3">
                <h4 className="font-semibold">Legendary</h4>
                <p>A supertype, not a card type. The "legend rule" means you can only control one legendary permanent with the same name at a time. If you play a second, you must sacrifice one.</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 3: Mana & Colors */}
        <AccordionItem value="mana-colors" className="card-frame overflow-hidden border-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Mana & Colors</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4 text-sm text-foreground/80">
              <p>Magic has five colors of mana. Each color has its own philosophy, strengths, and weaknesses. Decks can be one color, two colors, or even all five.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <span className="mana-symbol shrink-0 mana-w">W</span>
                  <div>
                    <strong>White</strong> — Plains
                    <p className="text-xs text-muted-foreground mt-0.5">Order, protection, life gain, small creatures working together, and board wipes. White wants to establish rules and enforce them.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mana-symbol shrink-0 mana-u">U</span>
                  <div>
                    <strong>Blue</strong> — Island
                    <p className="text-xs text-muted-foreground mt-0.5">Control, card draw, counterspells, flying creatures, and manipulation. Blue wins through knowledge and patience.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mana-symbol shrink-0 mana-b">B</span>
                  <div>
                    <strong>Black</strong> — Swamp
                    <p className="text-xs text-muted-foreground mt-0.5">Death, sacrifice, graveyard recursion, creature destruction, and paying life for power. Black will use any means to win.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mana-symbol shrink-0 mana-r">R</span>
                  <div>
                    <strong>Red</strong> — Mountain
                    <p className="text-xs text-muted-foreground mt-0.5">Aggression, direct damage (burn), haste, chaos, and impulsive card draw. Red acts first and thinks later.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mana-symbol shrink-0 mana-g">G</span>
                  <div>
                    <strong>Green</strong> — Forest
                    <p className="text-xs text-muted-foreground mt-0.5">Growth, big creatures, mana ramp, trample, and naturalism. Green believes in the power of nature and overwhelming force.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mana-symbol shrink-0 mana-c">C</span>
                  <div>
                    <strong>Colorless</strong>
                    <p className="text-xs text-muted-foreground mt-0.5">Any color of mana can pay for generic (colorless) costs. Artifacts often have colorless costs, making them playable in any deck.</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-primary mb-1">Multi-Color & Color Identity</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Multi-color cards require mana of each color shown in their cost.</li>
                  <li>In Commander, your deck can only include cards that match your commander's color identity.</li>
                  <li>Color identity includes mana symbols in the cost AND rules text of a card.</li>
                </ul>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 4: Commander Format */}
        <AccordionItem value="commander" className="card-frame overflow-hidden border-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Commander Format</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-3 text-sm text-foreground/80">
              <p>Commander (also called EDH) is the most popular casual format. It's designed for multiplayer free-for-all games with 4 players.</p>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-xs bg-primary/15 text-primary px-1.5 py-0.5 rounded font-bold shrink-0">100</span>
                  <p><strong>Singleton deck</strong> — Exactly 100 cards including your commander. Only 1 copy of each card allowed (except basic lands).</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs bg-primary/15 text-primary px-1.5 py-0.5 rounded font-bold shrink-0">40</span>
                  <p><strong>Starting life</strong> — Each player starts at 40 life instead of the usual 20.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs bg-primary/15 text-primary px-1.5 py-0.5 rounded font-bold shrink-0">21</span>
                  <p><strong>Commander damage</strong> — If a single commander deals 21 combat damage to a player, that player loses regardless of life total.</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-primary mb-1">The Command Zone</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Your commander starts in the command zone, not your library.</li>
                  <li>You can cast your commander from the command zone by paying its mana cost.</li>
                  <li>Each subsequent cast from the command zone costs an additional 2 mana (the "commander tax").</li>
                  <li>When your commander would go to the graveyard or exile, you may return it to the command zone instead.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-primary mb-1">Color Identity</h4>
                <p>Every card in your deck must match your commander's color identity. A Gruul (Red/Green) commander means you can only use red, green, and colorless cards. No sneaking in blue counterspells!</p>
              </div>

              <div>
                <h4 className="font-semibold text-primary mb-1">Multiplayer Politics</h4>
                <p>Commander is a social format. Making deals, forming temporary alliances, and choosing when to be aggressive vs. defensive are key skills. Don't become the biggest threat too early!</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 5: Keywords */}
        <AccordionItem value="keywords" className="card-frame overflow-hidden border-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Common Keywords ({keywords.length})</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-3">
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
              <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                {filteredKeywords.map((kw) => (
                  <div key={kw.name} className="flex items-start gap-2 text-sm py-1.5 border-b border-border/50 last:border-0">
                    <span className="font-semibold text-primary shrink-0 min-w-[120px]">{kw.name}</span>
                    <span className="text-foreground/70">{kw.description}</span>
                  </div>
                ))}
                {filteredKeywords.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No keywords match "{keywordSearch}"</p>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 6: Common Actions */}
        <AccordionItem value="actions" className="card-frame overflow-hidden border-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <Gem className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Common Actions & Plays</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-3 text-sm text-foreground/80">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-0.5">
                  <h4 className="font-semibold">Tap / Untap</h4>
                  <p className="text-xs text-muted-foreground">Turn a card sideways to use it (attacking, activating abilities, producing mana). It untaps at the start of your turn.</p>
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-semibold">Cast</h4>
                  <p className="text-xs text-muted-foreground">Play a spell by paying its mana cost. The spell goes on the stack and opponents can respond before it resolves.</p>
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-semibold">Sacrifice</h4>
                  <p className="text-xs text-muted-foreground">Send a permanent you control to the graveyard. This is a cost, not destruction — it can't be prevented.</p>
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-semibold">Exile</h4>
                  <p className="text-xs text-muted-foreground">Remove a card from the game entirely. Exiled cards don't go to the graveyard and are much harder to get back.</p>
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-semibold">Destroy</h4>
                  <p className="text-xs text-muted-foreground">Send a permanent to the graveyard. Cards with indestructible survive destroy effects.</p>
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-semibold">Counter</h4>
                  <p className="text-xs text-muted-foreground">Cancel a spell on the stack before it resolves. Only works on spells, not abilities (unless specifically stated).</p>
                </div>
              </div>

              <div className="border-t border-border/50 pt-3 space-y-3">
                <div>
                  <h4 className="font-semibold text-primary mb-1">The Stack</h4>
                  <p>When you cast a spell or activate an ability, it goes on "the stack." Opponents can respond by adding their own spells/abilities. The stack resolves last-in-first-out (LIFO). The last thing added resolves first.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-primary mb-1">Priority</h4>
                  <p>The active player (whose turn it is) gets priority first. After they act or pass, each other player gets a chance to respond. When all players pass priority, the top item on the stack resolves.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-primary mb-1">Mulligan</h4>
                  <p>If you don't like your opening hand, you can shuffle it back and draw a new hand of 7 cards. In Commander, the first mulligan is free. After that, you put one card on the bottom of your library for each mulligan taken.</p>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
