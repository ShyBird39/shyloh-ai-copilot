import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface PredefinedTag {
  id: string;
  tag_name: string;
  display_name: string;
  category: string;
  keywords: string[];
  sort_order: number;
}

interface PredictiveTagsProps {
  content: string;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function PredictiveTags({ content, selectedTags, onTagsChange }: PredictiveTagsProps) {
  const [allTags, setAllTags] = useState<PredefinedTag[]>([]);
  const [showAllTags, setShowAllTags] = useState(false);

  useEffect(() => {
    const fetchTags = async () => {
      const { data, error } = await supabase
        .from('predefined_tags')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (data && !error) {
        setAllTags(data);
      }
    };

    fetchTags();
  }, []);

  // Predict tags based on content
  const suggestedTags = useMemo(() => {
    if (!content.trim() || content.length < 3) return [];

    const contentLower = content.toLowerCase();
    const words = contentLower.split(/\s+/);
    
    const tagScores = allTags.map(tag => {
      let score = 0;
      
      tag.keywords.forEach(keyword => {
        const keywordLower = keyword.toLowerCase();
        
        // Exact phrase match
        if (contentLower.includes(keywordLower)) {
          score += 3;
        }
        
        // Individual word matches
        const keywordWords = keywordLower.split(/\s+/);
        keywordWords.forEach(kw => {
          if (words.includes(kw)) {
            score += 1;
          }
        });
      });
      
      return { tag, score };
    });

    return tagScores
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(({ tag }) => tag)
      .filter(tag => !selectedTags.includes(tag.tag_name));
  }, [content, allTags, selectedTags]);

  const toggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onTagsChange(selectedTags.filter(t => t !== tagName));
    } else {
      onTagsChange([...selectedTags, tagName]);
    }
  };

  const categorizedTags = useMemo(() => {
    const categories: Record<string, PredefinedTag[]> = {};
    allTags.forEach(tag => {
      if (!categories[tag.category]) {
        categories[tag.category] = [];
      }
      categories[tag.category].push(tag);
    });
    return categories;
  }, [allTags]);

  const getDisplayName = (tagName: string) => {
    return allTags.find(t => t.tag_name === tagName)?.display_name || tagName;
  };

  return (
    <div className="space-y-4">
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Selected Tags</label>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map(tagName => (
              <Badge
                key={tagName}
                variant="default"
                className="h-10 px-3 cursor-pointer hover:bg-primary/90 transition-colors"
                onClick={() => toggleTag(tagName)}
              >
                {getDisplayName(tagName)}
                <X className="ml-1 h-3 w-3" />
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Tags */}
      {suggestedTags.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Suggested Tags</label>
          <div className="flex flex-wrap gap-2">
            {suggestedTags.map(tag => (
              <Badge
                key={tag.tag_name}
                variant="outline"
                className="h-10 px-3 cursor-pointer hover:bg-accent transition-colors"
                onClick={() => toggleTag(tag.tag_name)}
              >
                {tag.display_name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Browse All Tags */}
      <div className="space-y-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowAllTags(!showAllTags)}
          className="h-8 px-2 text-muted-foreground hover:text-foreground"
        >
          {showAllTags ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
          Browse All Tags
        </Button>

        {showAllTags && (
          <div className="space-y-4 pt-2">
            {Object.entries(categorizedTags).map(([category, tags]) => (
              <div key={category} className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {category}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <Badge
                      key={tag.tag_name}
                      variant={selectedTags.includes(tag.tag_name) ? "default" : "outline"}
                      className="h-9 px-3 cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => toggleTag(tag.tag_name)}
                    >
                      {tag.display_name}
                      {selectedTags.includes(tag.tag_name) && <X className="ml-1 h-3 w-3" />}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
