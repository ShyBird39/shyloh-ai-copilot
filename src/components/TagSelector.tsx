import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";

const PREDEFINED_TAGS = [
  "Culture",
  "People",
  "Marketing",
  "FOH Ops",
  "BOH Ops",
  "Menu Dev",
  "Beverage",
  "Management",
  "Leadership",
  "Financial",
  "WWAHD"
];

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  customTags: string[];
  onAddCustomTag: (tag: string) => void;
  newTagInput: string;
  setNewTagInput: (value: string) => void;
}

export function TagSelector({
  selectedTags,
  onTagsChange,
  customTags,
  onAddCustomTag,
  newTagInput,
  setNewTagInput
}: TagSelectorProps) {
  const allAvailableTags = [...PREDEFINED_TAGS, ...customTags];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    if (newTagInput.trim()) {
      onAddCustomTag(newTagInput.trim());
    }
  };

  return (
    <div className="space-y-3">
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="default"
              className="cursor-pointer hover:bg-primary/80"
              onClick={() => toggleTag(tag)}
            >
              {tag}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}

      {/* Available Tags */}
      <div className="flex flex-wrap gap-2">
        {allAvailableTags
          .filter(tag => !selectedTags.includes(tag))
          .map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="cursor-pointer hover:bg-muted"
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Badge>
          ))}
      </div>

      {/* Add Custom Tag */}
      <div className="flex gap-2">
        <Input
          placeholder="Create custom tag..."
          value={newTagInput}
          onChange={(e) => setNewTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddCustomTag();
            }
          }}
          className="text-xs"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleAddCustomTag}
          disabled={!newTagInput.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
