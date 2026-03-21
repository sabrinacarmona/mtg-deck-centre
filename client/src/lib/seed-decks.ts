/**
 * Seed data: 4 precon Commander decks.
 * On first load (empty DB), these decklists are resolved via Scryfall and imported.
 */

export interface SeedDeck {
  name: string;
  format: string;
  decklist: string; // MTGO-style: "qty cardname" per line
}

export const SEED_DECKS: SeedDeck[] = [
  {
    name: "Draconic Destruction v2",
    format: "commander",
    decklist: `1 Atarka, World Render
1 Akoum Hellkite
1 Demanding Dragon
1 Draconic Disciple
1 Dragon Mage
1 Dragonkin Berserker
1 Dragonlord's Servant
1 Dragonmaster Outcast
1 Dragonspeaker Shaman
1 Drakuseth, Maw of Flames
1 Dream Pillager
1 Drumhunter
1 Flameblast Dragon
1 Foe-Razer Regent
1 Furnace Whelp
1 Harbinger of the Hunt
1 Hoard-Smelter Dragon
1 Loaming Shaman
1 Mordant Dragon
1 Rapacious Dragon
1 Runehorn Hellkite
1 Sakura-Tribe Elder
1 Savage Ventmaw
1 Scourge of Valkas
1 Steel Hellkite
1 Thunderbreak Regent
1 Thundermaw Hellkite
1 Tyrant's Familiar
1 Verix Bladewing
1 Sarkhan, the Dragonspeaker
1 Beast Within
1 Blossoming Defense
1 Hunter's Insight
1 Magmaquake
1 Provoke the Trolls
1 Return to Nature
1 Spit Flame
1 Unleash Fury
1 Chain Reaction
1 Clan Defiance
1 Cultivate
1 Harmonize
1 Hunter's Prowess
1 Primal Might
1 Shamanic Revelation
1 Sweltering Suns
1 Vandalblast
1 Arcane Signet
1 Atarka Monument
1 Commander's Sphere
1 Dragon's Hoard
1 Sol Ring
1 Swiftfoot Boots
1 Talisman of Impulse
1 Crucible of Fire
1 Dragon Tempest
1 Elemental Bond
1 Fires of Yavimaya
1 Frontier Siege
1 Garruk's Uprising
1 Cinder Glade
1 Command Tower
1 Game Trail
1 Haven of the Spirit Dragon
1 Kazandu Refuge
1 Path of Ancestry
1 Rugged Highlands
1 Shivan Oasis
1 Temple of Abandon
1 Timber Gorge
18 Mountain
12 Forest`,
  },
  {
    name: "Grand Larceny",
    format: "commander",
    decklist: `1 Gonti, Canny Acquisitor
1 Felix Five-Boots
1 Shadowmage Infiltrator
1 Silhana Ledgewalker
1 Trygon Predator
1 Cold-Eyed Selkie
1 Edric, Spymaster of Trest
1 The Mimeoplasm
1 Silent-Blade Oni
1 Baleful Strix
1 Diluvian Primordial
1 Triton Shorestalker
1 Whirler Rogue
1 Oblivion Sower
1 Void Attendant
1 Gonti, Lord of Luxury
1 Slither Blade
1 Hostage Taker
1 Thief of Sanity
1 Fallen Shinobi
1 Thieving Amalgam
1 Ohran Frostfang
1 Cazur, Ruthless Stalker
1 Ukkima, Stalking Shadow
1 Ghostly Pilferer
1 Thieving Skydiver
1 Bladegriff Prototype
1 Sage of the Beyond
1 Dazzling Sphinx
1 Nashi, Moon Sage's Scion
1 Brainstealer Dragon
1 Doc Aurlock, Grizzled Genius
1 Smirking Spelljacker
1 Orochi Soul-Reaver
1 Thieving Varmint
1 Savvy Trader
1 Tower Winder
1 Sol Ring
1 Fellwar Stone
1 Rampant Growth
1 Darksteel Ingot
1 Kodama's Reach
1 Three Visits
1 Putrefy
1 Prismatic Lens
1 Stolen Goods
1 Plasm Capture
1 Curse of the Swine
1 Villainous Wealth
1 Mind's Dilation
1 Chaos Wand
1 Arcane Signet
1 Feed the Swarm
1 Baleful Mastery
1 Culling Ritual
1 Cunning Rhetoric
1 Extract Brain
1 Siphon Insight
1 Predators' Hour
1 Arcane Heist
1 Heartless Conscription
1 Dream-Thief's Bandana
1 Exotic Orchard
1 Reliquary Tower
1 Drowned Catacomb
1 Darkslick Shores
1 Command Tower
1 Hinterland Harbor
1 Woodland Cemetery
1 Temple of Deceit
1 Temple of Mystery
1 Temple of Malady
1 Opulent Palace
1 Sunken Hollow
1 Fetid Pools
1 Access Tunnel
1 Overflowing Basin
1 Viridescent Bog
1 Llanowar Wastes
1 Underground River
1 Yavimaya Coast
1 Darkwater Catacombs
1 Dimir Aqueduct
1 Flooded Grove
1 Twilight Mire
5 Island
6 Swamp
4 Forest`,
  },
  {
    name: "Hosts of Mordor",
    format: "commander",
    decklist: `1 Sauron, Lord of the Rings
1 Saruman, the White Hand
1 Corsairs of Umbar
1 Monstrosity of the Lake
1 Subjugate the Hobbits
1 Shelob, Dread Weaver
1 Cavern-Hoard Dragon
1 Orcish Siegemaster
1 Rampaging War Mammoth
1 The Balrog of Moria
1 Gr\u00edma, Saruman's Footman
1 In the Darkness Bind Them
1 Lidless Gaze
1 Lord of the Nazg\u00fbl
1 Moria Scavenger
1 Summons of Saruman
1 Too Greedily, Too Deep
1 Wake the Dragon
1 Relic of Sauron
1 The Black Gate
1 Decree of Pain
1 Languish
1 Living Death
1 Reanimate
1 Blasphemous Act
1 Goblin Dark-Dwellers
1 Inferno Titan
1 Knollspine Dragon
1 Scourge of the Throne
1 Siege-Gang Commander
1 Treasure Nabber
1 Hostage Taker
1 Notion Thief
1 Treason of Isengard
1 Bitter Downfall
1 Troll of Khazad-d\u00fbm
1 Voracious Fell Beast
1 Fiery Inscription
1 Grishn\u00e1kh, Brash Instigator
1 Arcane Denial
1 Boon of the Wish-Giver
1 Consider
1 Deep Analysis
1 Fact or Fiction
1 Forbidden Alchemy
1 Feed the Swarm
1 Merciless Executioner
1 Revenge of Ravens
1 Anger
1 Faithless Looting
1 The Mouth of Sauron
1 Goblin Cratermaker
1 Guttersnipe
1 Shiny Impetus
1 Thrill of Possibility
1 Extract from Darkness
1 Arcane Signet
1 Basalt Monolith
1 Commander's Sphere
1 Everflowing Chalice
1 Mind Stone
1 Sol Ring
1 Worn Powerstone
1 Command Tower
1 Crumbling Necropolis
1 Evolving Wilds
1 Field of Ruin
1 Path of Ancestry
1 Rogue's Passage
1 Terramorphic Expanse
1 Choked Estuary
1 Desolate Lighthouse
1 Dragonskull Summit
1 Drowned Catacomb
1 Foreboding Ruins
1 Frostboil Snarl
1 Smoldering Marsh
1 Sulfur Falls
1 Sulfurous Springs
1 Sunken Hollow
1 Underground River
6 Island
6 Swamp
7 Mountain`,
  },
  {
    name: "Jeskai Striker",
    format: "commander",
    decklist: `1 Shiko and Narset, Unified
1 Elsha, Threefold Master
1 Archmage Emeritus
1 Baral and Kari Zev
1 Caldera Pyremaw
1 Goblin Electromancer
1 Guttersnipe
1 Haughty Djinn
1 Lier, Disciple of the Drowned
1 Manaform Hellkite
1 Mangara, the Diplomat
1 Monastery Mentor
1 Storm-Kiln Artist
1 Third Path Iconoclast
1 Transcendent Dragon
1 Velomachus Lorehold
1 Veyran, Voice of Duality
1 Voracious Bibliophile
1 Young Pyromancer
1 Aligned Heart
1 Curse of Opulence
1 Ghostly Prison
1 Shiny Impetus
1 Tempest Technique
1 Whirlwind of Thought
1 Adaptive Training Post
1 Arcane Signet
1 Azorius Signet
1 Boros Signet
1 Fellwar Stone
1 Izzet Signet
1 Sol Ring
1 Talisman of Progress
1 Abrade
1 Big Score
1 Consider
1 Electrodominance
1 Frantic Search
1 Magma Opus
1 Narset's Reversal
1 Opt
1 Pongify
1 Prismari Command
1 Sublime Epiphany
1 Swords to Plowshares
1 Think Twice
1 Transforming Flourish
1 Ancestral Vision
1 Baral's Expertise
1 Compulsive Research
1 Curse of the Swine
1 Deep Analysis
1 Dismantling Wave
1 Expressive Iteration
1 Faithless Looting
1 Mana Geyser
1 Ponder
1 Preordain
1 Rite of Replication
1 Time Wipe
1 Vanquish the Horde
1 Will of the Jeskai
1 Expansion // Explosion
1 Command Tower
1 Evolving Wilds
1 Mystic Monastery
1 Ash Barrens
1 Path of Ancestry
1 Perilous Landscape
1 Reliquary Tower
1 Temple of Enlightenment
1 Temple of Epiphany
1 Temple of Triumph
1 Adarkar Wastes
1 Battlefield Forge
1 Cascade Bluffs
1 Clifftop Retreat
1 Exotic Orchard
1 Ferrous Lake
1 Glacial Fortress
1 Irrigated Farmland
1 Prairie Stream
1 Rugged Prairie
1 Shivan Reef
1 Skycloud Expanse
1 Sulfur Falls
4 Plains
5 Island
5 Mountain`,
  },
];
