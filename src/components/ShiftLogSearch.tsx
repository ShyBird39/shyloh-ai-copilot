import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Calendar, AlertCircle } from "lucide-react";
import { getInitials } from "@/lib/utils";

interface ShiftLogSearchProps {
  restaurantId: string;
}

interface SearchResult {
  type: 'log' | 'summary';
  similarity: number;
  chunk_text: string;
  data: any;
}

export function ShiftLogSearch({ restaurantId }: ShiftLogSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsSearching(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in');
        return;
      }

      const { data, error } = await supabase.functions.invoke('search-shift-logs', {
        body: {
          query: query.trim(),
          restaurantId,
          limit: 10,
        },
      });

      if (error) throw error;

      setResults(data.results || []);
      
      if (data.results?.length === 0) {
        toast.info('No matching Manager Logs found');
      }
    } catch (error) {
      console.error('Error searching Manager Logs:', error);
      toast.error('Failed to search Manager Logs');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search Manager Logs... (e.g., 'ice machine issues last month')"
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Semantic search powered by AI - finds related entries even if worded differently
        </p>
      </Card>

      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              Found {results.length} result{results.length !== 1 ? 's' : ''}
            </h4>
          </div>

          {results.map((result, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant={result.type === 'log' ? 'default' : 'secondary'}>
                    {result.type === 'log' ? 'Log Entry' : 'Summary'}
                  </Badge>
                  {result.similarity && (
                    <Badge variant="outline">
                      {Math.round(result.similarity * 100)}% match
                    </Badge>
                  )}
                </div>
                {result.data?.urgency_level === 'urgent' && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Urgent
                  </Badge>
                )}
              </div>

              {result.type === 'log' && result.data && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(result.data.shift_date).toLocaleDateString()} • {result.data.shift_type}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {result.data.log_category.replace('_', ' ')}
                    </Badge>
                    {result.data.profiles?.display_name && (
                      <div className="flex items-center gap-1.5 ml-auto">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs">
                            {getInitials(result.data.profiles.display_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium">
                          {getInitials(result.data.profiles.display_name)}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm">{result.data.content}</p>
                </div>
              )}

              {result.type === 'summary' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {result.data?.shift_date ? new Date(result.data.shift_date).toLocaleDateString() : 'Unknown date'} • {result.data?.shift_type || 'Unknown shift'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground italic">
                    "{result.chunk_text.substring(0, 200)}..."
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
