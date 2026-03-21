import { useState, useEffect, useCallback } from "react";

export interface TagData {
  [cardName: string]: string[];
}

const TAG_COLORS: Record<string, string> = {
  Ramp: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Removal: "bg-red-500/20 text-red-400 border-red-500/30",
  "Card Draw": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Win Con": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Protection: "bg-slate-200/20 text-slate-300 border-slate-400/30",
  Tutor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "Board Wipe": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Finisher: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Combo Piece": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Utility: "bg-teal-500/20 text-teal-400 border-teal-500/30",
};

const DEFAULT_TAG = "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";

export const DEFAULT_TAG_SUGGESTIONS = [
  "Ramp",
  "Removal",
  "Card Draw",
  "Win Con",
  "Protection",
  "Tutor",
  "Board Wipe",
  "Finisher",
  "Combo Piece",
  "Utility",
];

export function getTagColor(tag: string): string {
  return TAG_COLORS[tag] || DEFAULT_TAG;
}

function storageKey(deckId: number): string {
  return `deck_tags_${deckId}`;
}

export function useTags(deckId: number) {
  const [tags, setTags] = useState<TagData>({});

  // Load tags from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey(deckId));
      if (stored) {
        setTags(JSON.parse(stored));
      } else {
        setTags({});
      }
    } catch {
      setTags({});
    }
  }, [deckId]);

  // Persist tags to localStorage
  const persist = useCallback(
    (newTags: TagData) => {
      setTags(newTags);
      localStorage.setItem(storageKey(deckId), JSON.stringify(newTags));
    },
    [deckId]
  );

  const addTag = useCallback(
    (cardName: string, tag: string) => {
      const trimmed = tag.trim();
      if (!trimmed) return;
      const current = tags[cardName] || [];
      if (current.includes(trimmed)) return;
      persist({ ...tags, [cardName]: [...current, trimmed] });
    },
    [tags, persist]
  );

  const removeTag = useCallback(
    (cardName: string, tag: string) => {
      const current = tags[cardName] || [];
      const updated = current.filter((t) => t !== tag);
      const newTags = { ...tags };
      if (updated.length === 0) {
        delete newTags[cardName];
      } else {
        newTags[cardName] = updated;
      }
      persist(newTags);
    },
    [tags, persist]
  );

  // Get all unique tags used in this deck
  const allUsedTags = Array.from(
    new Set(Object.values(tags).flat())
  ).sort();

  // Get tag counts
  const tagCounts: Record<string, number> = {};
  for (const cardTags of Object.values(tags)) {
    for (const tag of cardTags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }

  return {
    tags,
    addTag,
    removeTag,
    allUsedTags,
    tagCounts,
    getCardTags: (cardName: string) => tags[cardName] || [],
  };
}
