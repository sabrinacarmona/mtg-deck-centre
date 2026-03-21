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
    name: "Most Wanted",
    format: "commander",
    decklist: `1 Olivia, Opulent Outlaw
1 Vihaan, Goldwaker
1 Council's Judgment
1 Heliod's Intervention
1 Angelic Sell-Sword
1 We Ride at Dawn
1 Massacre Girl
1 Fain, the Broker
1 Witch of the Moors
1 Nighthawk Scavenger
1 Curtains' Call
1 Misfortune Teller
1 Painful Truths
1 Kamber, the Plunderer
1 Ogre Slumlord
1 Hex
1 Mari, the Killing Quill
1 Discreet Retreat
1 Charred Graverobber
1 Back in Town
1 Marshland Bloodcaster
1 Veinwitch Coven
1 Rankle, Master of Pranks
1 Dire Fleet Ravager
1 Mirror Entity
1 Dire Fleet Daredevil
1 Captain Lannery Storm
1 Seize the Spotlight
1 Grenzo, Havoc Raiser
1 Angrath's Marauders
1 Captivating Crew
1 Rain of Riches
1 Laurine, the Diversion
1 Mass Mutiny
1 Dead Before Sunrise
1 Graywater's Fixer
1 Life Insurance
1 Breena, the Demagogue
1 Queen Marchesa
1 Idol of Oblivion
1 Academy Manufactor
1 Bounty Board
1 Mistmeadow Skulk
1 Requisition Raid
1 Changeling Outcast
1 Feed the Swarm
1 Deadly Dispute
1 Morbid Opportunist
1 Aetherborn Marauder
1 Tenured Inkcaster
1 Shoot the Sheriff
1 Lightning Greaves
1 Impulsive Pilferer
1 Shiny Impetus
1 Humble Defector
1 Glittering Stockpile
1 Boros Charm
1 Arcane Signet
1 Trailblazer's Boots
1 Bandit's Haul
1 Orzhov Signet
1 Sol Ring
1 Rakdos Signet
1 Command Tower
1 Bojuka Bog
1 Path of Ancestry
1 Rogue's Passage
1 Demolition Field
1 Tainted Peak
1 Sunhome, Fortress of the Legion
1 Nomad Outpost
1 Temple of the False God
1 Fetid Heath
1 Command Beacon
1 Vault of the Archangel
1 Dragonskull Summit
1 Temple of Silence
1 Temple of Malice
1 Exotic Orchard
1 Temple of Triumph
1 Clifftop Retreat
1 Isolated Chapel
1 Bonders' Enclave
1 Caves of Koilos
1 Battlefield Forge
1 Sulfurous Springs
1 Rugged Prairie
1 Desolate Mire
1 Shadowblood Ridge
1 Canyon Slough
1 Smoldering Marsh
1 Blackcleave Cliffs
2 Plains
4 Swamp
2 Mountain`,
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
  {
    name: "Will's First Flight",
    format: "commander",
    decklist: `1 Isperia, Supreme Judge
1 Archon of Redemption
1 Cartographer's Hawk
1 Cleansing Nova
1 Emeria Angel
1 Gideon Jura
1 Hanged Executioner
1 Remorseful Cleric
1 Sephara, Sky's Blade
1 Steel-Plume Marshal
1 Storm Herd
1 True Conviction
1 Angler Turtle
1 Bident of Thassa
1 Diluvian Primordial
1 Ever-Watching Threshold
1 Faerie Formation
1 Gravitational Shift
1 Inspired Sphinx
1 Sharding Sphinx
1 Sphinx of Enlightenment
1 Windreader Sphinx
1 Absorb
1 Skycat Sovereign
1 Sphinx's Revelation
1 Time Wipe
1 Moorland Haunt
1 Port Town
1 Prairie Stream
1 Temple of Enlightenment
1 Aven Gagglemaster
1 Banishing Light
1 Condemn
1 Crush Contraband
1 Disenchant
1 Generous Gift
1 Kangee's Lieutenant
1 Rally of Wings
1 Soul Snare
1 Swords to Plowshares
1 Vow of Duty
1 Aetherize
1 Counterspell
1 Favorable Winds
1 Negate
1 Tide Skimmer
1 Warden of Evos Isle
1 Winged Words
1 Cloudblazer
1 Empyrean Eagle
1 Jubilant Skybonder
1 Kangee, Sky Warden
1 Migratory Route
1 Staggering Insight
1 Thunderclap Wyvern
1 Arcane Signet
1 Azorius Signet
1 Commander's Sphere
1 Hedron Archive
1 Pilgrim's Eye
1 Sky Diamond
1 Skyscanner
1 Sol Ring
1 Talisman of Progress
1 Thought Vessel
1 Coastal Tower
1 Command Tower
1 Meandering River
1 Sejiri Refuge
1 Tranquil Cove
15 Plains
15 Island`,
  },
  {
    name: "Will's Fallout: Science!",
    format: "commander",
    decklist: `1 Dr. Madison Li
1 Arcade Gannon
1 Assaultron Dominator
1 Behemoth of Vault 0
1 Brotherhood Scribe
1 Curie, Emergent Intelligence
1 Elder Owyn Lyons
1 Liberty Prime, Recharged
1 Loyal Apprentice
1 Nick Valentine, Private Eye
1 Paladin Danse, Steel Maverick
1 Red Death, Shipwrecker
1 Rex, Cyber-Hound
1 Robobrain War Mind
1 Sentinel Sarah Lyons
1 Sentry Bot
1 Shaun, Father of Synths
1 Solemn Simulacrum
1 Steel Overseer
1 Synth Eradicator
1 Synth Infiltrator
1 The Motherlode, Excavator
1 Whirler Rogue
1 Bottle-Cap Blast
1 Crush Contraband
1 Dispatch
1 Electrosiphon
1 Glimmer of Genius
1 Swords to Plowshares
1 Thirst for Knowledge
1 Unexpected Windfall
1 Arcane Signet
1 Automated Assembly Line
1 Brotherhood Vertibird
1 Endurance Bobblehead
1 Everflowing Chalice
1 Expert-Level Safe
1 Intelligence Bobblehead
1 Lightning Greaves
1 Mind Stone
1 Mystic Forge
1 Nuka-Cola Vending Machine
1 Panharmonicon
1 Plasma Caster
1 Sol Ring
1 T-45 Power Armor
1 Talisman of Conviction
1 Talisman of Creativity
1 Talisman of Progress
1 The Prydwen, Steel Flagship
1 Thought Vessel
1 Wayfarer's Bauble
1 Mechanized Production
1 Nerd Rage
1 Overencumbered
1 Vault 112: Sadistic Simulation
1 Vault 13: Dweller\u0027s Journey
1 Austere Command
1 One with the Machine
1 Open the Vaults
1 Wake the Past
1 James, Wandering Dad
1 C.A.M.P.
1 HELIOS One
1 Ash Barrens
1 Buried Ruin
1 Clifftop Retreat
1 Command Tower
1 Evolving Wilds
1 Exotic Orchard
1 Ferrous Lake
1 Glacial Fortress
1 Irrigated Farmland
1 Myriad Landscape
1 Mystic Monastery
1 Path of Ancestry
1 Prairie Stream
1 Razortide Bridge
1 Rustvale Bridge
1 Silverbluff Bridge
1 Skycloud Expanse
1 Spire of Industry
1 Sulfur Falls
1 Temple of Enlightenment
1 Temple of Epiphany
1 Terramorphic Expanse
1 Treasure Vault
5 Island
4 Mountain
4 Plains`,
  },
];
