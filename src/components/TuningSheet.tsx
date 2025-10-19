import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SliderConfig {
  id: string;
  emoji: string;
  title: string;
  leftLabel: string;
  leftExample: string;
  rightLabel: string;
  rightExample: string;
  hints: {
    low: string;
    medium: string;
    high: string;
  };
}

const sliders: SliderConfig[] = [
  {
    id: "profit_motivation",
    emoji: "💰",
    title: "Profit Motivation",
    leftLabel: "Mission-Driven",
    leftExample: "Chez Panisse",
    rightLabel: "Margin-Focused",
    rightExample: "Cheesecake Factory",
    hints: {
      low: "Prioritize values, community impact, and quality over pure profit",
      medium: "Balance mission with margins—sustainable profitability matters",
      high: "Maximize efficiency and revenue per square foot"
    }
  },
  {
    id: "service_philosophy",
    emoji: "⚡",
    title: "Service Philosophy",
    leftLabel: "Quick & Efficient",
    leftExample: "Chipotle",
    rightLabel: "Slow & Memorable",
    rightExample: "Eleven Madison",
    hints: {
      low: "Speed and throughput—get guests in and out efficiently",
      medium: "Balance pace with experience quality",
      high: "Time is secondary to creating unforgettable moments"
    }
  },
  {
    id: "revenue_strategy",
    emoji: "📊",
    title: "Revenue Strategy",
    leftLabel: "Pack Them In",
    leftExample: "Olive Garden",
    rightLabel: "Premium Pricing",
    rightExample: "Le Bernardin",
    hints: {
      low: "Volume-driven—affordable pricing, high turnover",
      medium: "Mid-market positioning with solid check averages",
      high: "Exclusive experience with premium pricing power"
    }
  },
  {
    id: "market_position",
    emoji: "📍",
    title: "Market Position",
    leftLabel: "Neighborhood Spot",
    leftExample: "Your local diner",
    rightLabel: "Destination Dining",
    rightExample: "The French Laundry",
    hints: {
      low: "Community anchor—regulars are your bread and butter",
      medium: "Known in your area, draw from nearby neighborhoods",
      high: "Worth traveling for—people plan trips around you"
    }
  },
  {
    id: "team_philosophy",
    emoji: "👥",
    title: "Team Philosophy",
    leftLabel: "Simple Systems",
    leftExample: "McDonald's",
    rightLabel: "Career Development",
    rightExample: "Union Square Hospitality",
    hints: {
      low: "Standardized processes, minimal training required",
      medium: "Invest in core team while keeping systems learnable",
      high: "Cultivate career hospitality professionals"
    }
  },
  {
    id: "innovation_appetite",
    emoji: "🎲",
    title: "Innovation Appetite",
    leftLabel: "If It Ain't Broke",
    leftExample: "Peter Luger",
    rightLabel: "Always Experimenting",
    rightExample: "Alinea",
    hints: {
      low: "Classic, consistent—stick with what works",
      medium: "Evolve thoughtfully, test new ideas carefully",
      high: "Push boundaries, embrace change and creativity"
    }
  }
];

interface TuningSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantId: string;
}

export const TuningSheet = ({ open, onOpenChange, restaurantId }: TuningSheetProps) => {
  const [values, setValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    sliders.forEach(slider => {
      initial[slider.id] = 50;
    });
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [activeSlider, setActiveSlider] = useState<string | null>(null);

  const handleSliderChange = (id: string, value: number) => {
    setValues(prev => ({ ...prev, [id]: value }));
  };

  const handleReset = () => {
    const neutral: Record<string, number> = {};
    sliders.forEach(slider => {
      neutral[slider.id] = 50;
    });
    setValues(neutral);
    setShowSummary(false);
    toast.success("Reset to neutral");
  };

  const handleSave = async () => {
    setSaving(true);
    setShowSummary(true);

    try {
      const { error } = await supabase
        .from("restaurants")
        .update({ tuning_profile: values })
        .eq("restaurant_id", restaurantId);

      if (error) throw error;

      console.log("Tuning Profile Saved:", values);
      toast.success("Your profile has been saved!");
    } catch (error) {
      console.error("Error saving tuning profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const getHint = (slider: SliderConfig, value: number) => {
    if (value <= 33) return slider.hints.low;
    if (value <= 66) return slider.hints.medium;
    return slider.hints.high;
  };

  const getLabel = (slider: SliderConfig, value: number) => {
    if (value === 50) return "Neutral";
    if (value < 50) return slider.leftLabel;
    return slider.rightLabel;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[900px] overflow-y-auto p-0 bg-card">
        <div className="sticky top-0 z-10 bg-card border-b border-border px-8 py-6">
          <div className="flex items-start justify-between">
            <SheetHeader className="flex-1">
              <SheetTitle className="text-[32px] font-bold text-primary mb-2">
                Set Your Priorities
              </SheetTitle>
              <p className="text-card-foreground text-base">
                Help Shyloh understand what matters most to your restaurant
              </p>
              <p className="text-muted-foreground text-sm">
                Drag each slider to match your philosophy
              </p>
            </SheetHeader>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="px-8 py-6">
          {/* Sliders */}
          <div className="space-y-10 mb-12">
            {sliders.map((slider, index) => (
              <div
                key={slider.id}
                className="animate-fade-in"
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  opacity: 1
                }}
              >
                {/* Slider Title & Value */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-card-foreground flex items-center gap-2">
                    <span>{slider.emoji}</span>
                    <span>{slider.title}</span>
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {getLabel(slider, values[slider.id])}
                    </span>
                    <span className="text-xl font-bold text-primary min-w-[50px] text-right">
                      {values[slider.id]}
                    </span>
                  </div>
                </div>

                {/* Labels */}
                <div className="flex justify-between mb-2 text-sm">
                  <div className="text-card-foreground">
                    <span className="font-medium">{slider.leftLabel}</span>
                    <span className="text-muted-foreground italic ml-2">({slider.leftExample})</span>
                  </div>
                  <div className="text-card-foreground text-right">
                    <span className="font-medium">{slider.rightLabel}</span>
                    <span className="text-muted-foreground italic ml-2">({slider.rightExample})</span>
                  </div>
                </div>

                {/* Slider */}
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={values[slider.id]}
                    onChange={(e) => handleSliderChange(slider.id, parseInt(e.target.value))}
                    onMouseDown={() => setActiveSlider(slider.id)}
                    onMouseUp={() => setActiveSlider(null)}
                    onTouchStart={() => setActiveSlider(slider.id)}
                    onTouchEnd={() => setActiveSlider(null)}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer transition-all duration-300"
                    style={{
                      background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${values[slider.id]}%, hsl(var(--muted)) ${values[slider.id]}%, hsl(var(--muted)) 100%)`,
                    }}
                  />
                  <style>{`
                    input[type="range"]::-webkit-slider-thumb {
                      appearance: none;
                      width: 32px;
                      height: 32px;
                      border-radius: 50%;
                      background: hsl(var(--primary));
                      border: 3px solid hsl(var(--background));
                      cursor: pointer;
                      transition: transform 0.2s ease;
                      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                    }
                    input[type="range"]::-webkit-slider-thumb:hover {
                      transform: scale(1.2);
                    }
                    input[type="range"]::-webkit-slider-thumb:active {
                      transform: scale(1.2);
                      box-shadow: 0 0 0 8px hsla(var(--primary-glow) / 0.2);
                    }
                    input[type="range"]::-moz-range-thumb {
                      width: 32px;
                      height: 32px;
                      border-radius: 50%;
                      background: hsl(var(--primary));
                      border: 3px solid hsl(var(--background));
                      cursor: pointer;
                      transition: transform 0.2s ease;
                      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                    }
                    input[type="range"]::-moz-range-thumb:hover {
                      transform: scale(1.2);
                    }
                    input[type="range"]::-moz-range-thumb:active {
                      transform: scale(1.2);
                      box-shadow: 0 0 0 8px hsla(var(--primary-glow) / 0.2);
                    }
                  `}</style>
                </div>

                {/* Hint */}
                <p className="text-sm text-muted-foreground mt-2 min-h-[40px] transition-all duration-300">
                  {getHint(slider, values[slider.id])}
                </p>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-4 justify-center mb-8">
            <Button
              variant="outline"
              onClick={handleReset}
              className="px-8 py-6"
            >
              Reset to Neutral
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              variant="hero"
              className="px-8 py-6"
            >
              {saving ? "Saving..." : "Save My Profile"}
            </Button>
          </div>

          {/* Summary Panel */}
          {showSummary && (
            <Card className="bg-muted border-border p-6 animate-fade-in">
              <h3 className="text-xl font-semibold text-card-foreground mb-4 text-center">
                Your Tuning Profile
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {sliders.map((slider) => (
                  <div key={slider.id} className="flex justify-between items-center">
                    <span className="text-sm text-card-foreground flex items-center gap-1">
                      <span>{slider.emoji}</span>
                      <span>{slider.title}:</span>
                    </span>
                    <span className="text-sm font-semibold text-primary">
                      {values[slider.id]} - {getLabel(slider, values[slider.id])}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
