import { useState, useRef, useEffect } from "react";
import { Tag, X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getTagColor, DEFAULT_TAG_SUGGESTIONS } from "@/hooks/use-tags";

interface CardTagEditorProps {
  cardName: string;
  tags: string[];
  allUsedTags: string[];
  onAddTag: (cardName: string, tag: string) => void;
  onRemoveTag: (cardName: string, tag: string) => void;
  onClose: () => void;
}

export default function CardTagEditor({
  cardName,
  tags,
  allUsedTags,
  onAddTag,
  onRemoveTag,
  onClose,
}: CardTagEditorProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const suggestions = [
    ...allUsedTags.filter((t) => !tags.includes(t)),
    ...DEFAULT_TAG_SUGGESTIONS.filter((t) => !tags.includes(t) && !allUsedTags.includes(t)),
  ].filter((t) => !input || t.toLowerCase().includes(input.toLowerCase()));

  const handleAdd = (tag: string) => {
    onAddTag(cardName, tag);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && input.trim()) {
      handleAdd(input.trim());
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-card-border rounded-xl p-4 w-full max-w-sm space-y-3 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Tags for {cardName}</h3>
          </div>
          <button
            className="w-6 h-6 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center"
            onClick={onClose}
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Current tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${getTagColor(tag)}`}
              >
                {tag}
                <button
                  className="hover:opacity-70"
                  onClick={() => onRemoveTag(cardName, tag)}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-1.5">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a tag name..."
            className="h-8 text-xs bg-muted/50"
          />
          {input.trim() && (
            <button
              className="h-8 px-2 rounded-md bg-primary/20 hover:bg-primary/30 text-primary text-xs flex items-center gap-1 shrink-0"
              onClick={() => handleAdd(input.trim())}
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          )}
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div>
            <div className="text-[10px] text-muted-foreground mb-1">Suggestions</div>
            <div className="flex flex-wrap gap-1">
              {suggestions.slice(0, 12).map((tag) => (
                <button
                  key={tag}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium border hover:opacity-80 transition-opacity ${getTagColor(tag)}`}
                  onClick={() => handleAdd(tag)}
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
