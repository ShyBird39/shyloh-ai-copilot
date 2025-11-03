import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { X, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

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

  // AI-powered tag suggestions
  useEffect(() => {
    if (!content || content.trim().length < 20 || allTags.length === 0) {
      setAiSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingAI(true);
      setAiError(null);

      try {
        const { data, error } = await supabase.functions.invoke('suggest-log-tags', {
          body: { content, tags: allTags }
        });

        if (error) throw error;

        setAiSuggestions(data?.suggestions || []);
      } catch (error) {
        console.error('Error getting AI suggestions:', error);
        setAiError('Failed to get AI suggestions');
        setAiSuggestions([]);
      } finally {
        setIsLoadingAI(false);
      }
    }, 1000); // Debounce: wait 1 second after user stops typing

    return () => clearTimeout(timer);
  }, [content, allTags]);

  // Filter out already selected tags from AI suggestions
  const filteredAiSuggestions = useMemo(() => {
    return aiSuggestions.filter(s => !selectedTags.includes(s.tag_name));
  }, [aiSuggestions, selectedTags]);

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

      {/* AI Suggested Tags */}
      {(isLoadingAI || filteredAiSuggestions.length > 0) && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            AI Suggested Tags
          </label>
          {isLoadingAI ? (
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-10 w-24" />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {filteredAiSuggestions.map(suggestion => {
                const tag = allTags.find(t => t.tag_name === suggestion.tag_name);
                if (!tag) return null;
                
                return (
                  <Badge
                    key={suggestion.tag_name}
                    variant="secondary"
                    className="h-10 px-3 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => toggleTag(suggestion.tag_name)}
                    style={{ opacity: 0.7 + suggestion.confidence * 0.3 }}
                    title={suggestion.reason}
                  >
                    {tag.display_name}
                    <Sparkles className="ml-1 h-3 w-3" />
                  </Badge>
                );
              })}
            </div>
          )}
          {aiError && (
            <p className="text-xs text-destructive">{aiError}</p>
          )}
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
                      variant={selectedTags.includes(tag.tag_name) ? "default" : "secondary"}
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
