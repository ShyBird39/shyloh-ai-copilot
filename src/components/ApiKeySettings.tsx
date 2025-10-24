import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ApiKeySettingsProps {
  restaurantId: string;
  currentApiKey?: string | null;
}

export const ApiKeySettings = ({ restaurantId, currentApiKey }: ApiKeySettingsProps) => {
  const [apiKey, setApiKey] = useState(currentApiKey || "");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ anthropic_api_key: apiKey || null })
        .eq('id', restaurantId);

      if (error) throw error;

      toast.success("API key updated successfully");
    } catch (error) {
      console.error('Error saving API key:', error);
      toast.error("Failed to save API key");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ anthropic_api_key: null })
        .eq('id', restaurantId);

      if (error) throw error;

      setApiKey("");
      toast.success("API key cleared - using default key");
    } catch (error) {
      console.error('Error clearing API key:', error);
      toast.error("Failed to clear API key");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center gap-2 mb-4">
        <Key className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-card-foreground">
          Restaurant-Specific API Key
        </h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Use your own Anthropic API key for this restaurant. Leave empty to use the default key.
      </p>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-key">Anthropic API Key</Label>
          <div className="relative">
            <Input
              id="api-key"
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1"
          >
            {saving ? "Saving..." : "Save Key"}
          </Button>
          {apiKey && (
            <Button
              onClick={handleClear}
              disabled={saving}
              variant="outline"
            >
              Clear
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
