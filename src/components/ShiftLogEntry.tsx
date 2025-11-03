import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, UnfoldVertical } from "lucide-react";
import { PredictiveTags } from "./manager-log/PredictiveTags";

interface ShiftLogEntryProps {
  restaurantId: string;
  shiftDate: string;
  shiftType: string;
  onEntrySaved?: () => void;
}

const CATEGORIES = [
  { value: 'incident', label: 'Incident', description: 'Customer complaints, accidents, conflicts' },
  { value: 'maintenance', label: 'Maintenance', description: 'Equipment issues, repairs needed' },
  { value: 'staff_notes', label: 'Staff Notes', description: 'Team updates, scheduling notes' },
  { value: 'guest_feedback', label: 'Guest Feedback', description: 'Compliments, suggestions' },
  { value: 'eighty_sixed', label: "86'd Items", description: 'Out of stock items' },
  { value: 'shout_outs', label: 'Shout-Outs', description: 'Team member recognition' },
];

export function ShiftLogEntry({ restaurantId, shiftDate, shiftType, onEntrySaved }: ShiftLogEntryProps) {
  const [category, setCategory] = useState<string>('staff_notes');
  const [isUrgent, setIsUrgent] = useState(false);
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error('Please enter log content');
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to create log entries');
        return;
      }

      const { error } = await supabase
        .from('shift_logs')
        .insert({
          restaurant_id: restaurantId,
          user_id: user.id,
          shift_date: shiftDate,
          shift_type: shiftType,
          log_category: category,
          urgency_level: isUrgent ? 'urgent' : 'normal',
          content: content.trim(),
          tags: selectedTags,
        });

      if (error) throw error;

      toast.success('Log entry saved', {
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      });

      // Reset form
      setContent('');
      setIsUrgent(false);
      setSelectedTags([]);
      
      onEntrySaved?.();
    } catch (error) {
      console.error('Error saving log entry:', error);
      toast.error('Failed to save log entry');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">New Manager Log Entry</h3>
        {isUrgent && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Urgent
          </Badge>
        )}
      </div>

      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-background text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div>
                      <div className="font-medium">{cat.label}</div>
                      <div className="text-xs text-muted-foreground">{cat.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Urgency</label>
            <Button
              variant={isUrgent ? "destructive" : "secondary"}
              className="w-full"
              onClick={() => setIsUrgent(!isUrgent)}
            >
              {isUrgent ? (
                <>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Urgent
                </>
              ) : (
                'Normal'
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Log Entry</label>
          <div className="relative">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter Manager Log details..."
              className="min-h-[300px] resize-y bg-background text-foreground pr-8"
            />
            <div className="absolute bottom-2 right-2 pointer-events-none text-muted-foreground opacity-60">
              <UnfoldVertical className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Predictive Tags */}
        <PredictiveTags
          content={content}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
        />

        <Button
          onClick={handleSave}
          disabled={isSaving || !content.trim()}
          className="w-full"
        >
          {isSaving ? 'Saving...' : `Save Log Entry${selectedTags.length > 0 ? ` (${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''})` : ''}`}
        </Button>
      </div>
    </Card>
  );
}
