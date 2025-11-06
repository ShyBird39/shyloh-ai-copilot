import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { Download, Share2, Sparkles, DollarSign, Users, TrendingUp, RefreshCw, Plus } from "lucide-react";

interface ShiftSummaryViewProps {
  restaurantId: string;
  shiftDate: string;
  shiftType: string;
}

interface ShiftSummary {
  id: string;
  summary_markdown: string;
  action_items: Array<{ task: string; completed: boolean; urgency: string }>;
  toast_metrics: {
    netSales?: number;
    guestCount?: number;
    ordersCount?: number;
    avgCheckSize?: number;
  };
  created_at: string;
}

export function ShiftSummaryView({ restaurantId, shiftDate, shiftType }: ShiftSummaryViewProps) {
  const [summary, setSummary] = useState<ShiftSummary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, [restaurantId, shiftDate, shiftType]);

  const loadSummary = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('shift_summaries')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('shift_date', shiftDate)
        .eq('shift_type', shiftType)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setSummary(data);
    } catch (error) {
      console.error('Error loading summary:', error);
      toast.error('Failed to load shift summary');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in');
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-shift-summary', {
        body: {
          restaurantId,
          shiftDate,
          shiftType,
        },
      });

      if (error) throw error;

      toast.success('Shift summary generated!', {
        icon: <Sparkles className="h-5 w-5 text-yellow-500" />,
      });

      await loadSummary();
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error('Failed to generate summary');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleActionItem = async (index: number) => {
    if (!summary) return;

    const updatedItems = [...summary.action_items];
    updatedItems[index].completed = !updatedItems[index].completed;

    try {
      const { error } = await supabase
        .from('shift_summaries')
        .update({ action_items: updatedItems })
        .eq('id', summary.id);

      if (error) throw error;

      setSummary({ ...summary, action_items: updatedItems });
      toast.success('Action item updated');
    } catch (error) {
      console.error('Error updating action item:', error);
      toast.error('Failed to update action item');
    }
  };

  const handleExportPDF = () => {
    toast.info('PDF export coming soon!');
  };

  const handleShare = () => {
    toast.info('Share functionality coming soon!');
  };

  const handleAddToTasks = (task: string) => {
    toast.success('Task added to your task list!');
    // TODO: Implement actual task creation
  };

  // Preprocess markdown to ensure proper list formatting and remove data-based items
  const processMarkdown = (markdown: string) => {
    // Split inline bullet points (• item • item) into proper list format
    let processed = markdown.replace(/•\s*/g, '\n• ').trim();
    
    // Remove lines that are data-based metrics (Net Sales, Guest Count, Order Count, Average Check)
    const linesToRemove = [
      /[-•]\s*\*\*Net Sales:\*\*.*/gi,
      /[-•]\s*\*\*Guest Count:\*\*.*/gi,
      /[-•]\s*\*\*Order Count:\*\*.*/gi,
      /[-•]\s*\*\*Average Check:\*\*.*/gi,
    ];
    
    linesToRemove.forEach(pattern => {
      processed = processed.replace(pattern, '');
    });
    
    // Clean up extra whitespace/newlines
    processed = processed.replace(/\n\n+/g, '\n\n').trim();
    
    return processed;
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/2" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-3/4" />
        </div>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card className="p-6 text-center space-y-4">
        <Sparkles className="h-12 w-12 mx-auto text-muted-foreground" />
        <div>
          <h3 className="text-lg font-semibold mb-2">No Shift Summary Yet</h3>
          <p className="text-muted-foreground mb-4">
            Generate an AI-powered summary of this shift's activities
          </p>
        </div>
        <Button onClick={handleGenerateSummary} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Sparkles className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Shift Summary
            </>
          )}
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Metrics */}
      {summary.toast_metrics && Object.keys(summary.toast_metrics).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summary.toast_metrics.netSales !== undefined && (
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">Net Sales</span>
              </div>
              <div className="text-2xl font-bold">
                ${summary.toast_metrics.netSales.toFixed(2)}
              </div>
            </Card>
          )}
          {summary.toast_metrics.guestCount !== undefined && (
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="h-4 w-4" />
                <span className="text-sm">Covers</span>
              </div>
              <div className="text-2xl font-bold">
                {summary.toast_metrics.guestCount}
              </div>
            </Card>
          )}
          {summary.toast_metrics.ordersCount !== undefined && (
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Orders</span>
              </div>
              <div className="text-2xl font-bold">
                {summary.toast_metrics.ordersCount}
              </div>
            </Card>
          )}
          {summary.toast_metrics.avgCheckSize !== undefined && (
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">Avg Check</span>
              </div>
              <div className="text-2xl font-bold">
                ${summary.toast_metrics.avgCheckSize.toFixed(2)}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Summary Content */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold">Shift Summary</h3>
            <p className="text-sm text-muted-foreground">
              {shiftDate} • {shiftType.charAt(0).toUpperCase() + shiftType.slice(1)} Shift
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleGenerateSummary}
              disabled={isGenerating}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        <div className="prose prose-sm max-w-none dark:prose-invert [&_li]:block [&_li]:mb-2 [&_ul]:space-y-1">
          <ReactMarkdown rehypePlugins={[rehypeRaw]}>{processMarkdown(summary.summary_markdown)}</ReactMarkdown>
        </div>
      </Card>

      {/* Action Items */}
      {summary.action_items && summary.action_items.length > 0 && (
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4">Action Items</h4>
          <div className="space-y-3">
            {summary.action_items.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
              >
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={() => handleToggleActionItem(index)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className={item.completed ? 'line-through text-muted-foreground' : ''}>
                    {item.task}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {item.urgency === 'high' && !item.completed && (
                    <Badge variant="destructive">
                      Urgent
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddToTasks(item.task)}
                    className="h-8 px-2"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add to Tasks
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
