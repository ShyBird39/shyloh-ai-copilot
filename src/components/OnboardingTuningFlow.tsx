import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PinInput } from "@/components/PinInput";

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
    leftLabel: "Mission-First",
    leftExample: "Values-driven, community impact focus",
    rightLabel: "Margin-First",
    rightExample: "Revenue optimization priority",
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
    leftLabel: "Efficiency-Focused",
    leftExample: "Quick service, high throughput",
    rightLabel: "Experience-Focused",
    rightExample: "Memorable moments, unhurried pace",
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
    leftLabel: "Volume-Driven",
    leftExample: "Accessible pricing, high turnover",
    rightLabel: "Premium-Driven",
    rightExample: "Exclusive positioning, higher check",
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
    leftLabel: "Local Anchor",
    leftExample: "Community hub for regulars",
    rightLabel: "Destination Draw",
    rightExample: "Worth traveling to experience",
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
    leftLabel: "Systems-First",
    leftExample: "Standardized, minimal training",
    rightLabel: "Development-First",
    rightExample: "Career hospitality professionals",
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
    leftLabel: "Tradition-Focused",
    leftExample: "Consistent classics, proven methods",
    rightLabel: "Innovation-Focused",
    rightExample: "Creative evolution, boundary-pushing",
    hints: {
      low: "Classic, consistent—stick with what works",
      medium: "Evolve thoughtfully, test new ideas carefully",
      high: "Push boundaries, embrace change and creativity"
    }
  }
];

interface OnboardingTuningFlowProps {
  restaurantId: string;
  onComplete: () => void;
  onBack: () => void;
}

export const OnboardingTuningFlow = ({ restaurantId, onComplete, onBack }: OnboardingTuningFlowProps) => {
  const [step, setStep] = useState<"intro" | "pin" | "sliders" | "recap">("intro");
  const [currentSliderIndex, setCurrentSliderIndex] = useState(0);
  const [values, setValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    sliders.forEach(slider => {
      initial[slider.id] = 50;
    });
    return initial;
  });
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load existing tuning profile on mount
  useEffect(() => {
    const loadTuningProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("restaurants")
          .select("tuning_profile, tuning_pin")
          .eq("id", restaurantId)
          .single();

        if (error) throw error;

        if (data?.tuning_profile) {
          setValues(data.tuning_profile);
          // If they have a PIN, skip intro and go straight to sliders
          if (data.tuning_pin) {
            setStep("sliders");
          }
        }
      } catch (error) {
        console.error("Error loading tuning profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTuningProfile();
  }, [restaurantId]);

  const handlePinSubmit = async (pin: string) => {
    try {
      const { error } = await supabase
        .from("restaurants")
        .update({ tuning_pin: pin })
        .eq("id", restaurantId);

      if (error) throw error;

      toast.success("PIN set successfully!");
      setPinModalOpen(false);
      setStep("sliders");
    } catch (error) {
      console.error("Error setting PIN:", error);
      toast.error("Failed to set PIN");
    }
  };

  const handleSliderChange = async (id: string, value: number) => {
    const newValues = { ...values, [id]: value };
    setValues(newValues);
    
    // Save progress incrementally
    try {
      await supabase
        .from("restaurants")
        .update({ tuning_profile: newValues })
        .eq("id", restaurantId);
    } catch (error) {
      console.error("Error saving tuning progress:", error);
    }
  };

  const handleNext = () => {
    if (currentSliderIndex < sliders.length - 1) {
      setCurrentSliderIndex(currentSliderIndex + 1);
    } else {
      setStep("recap");
    }
  };

  const handlePrevious = () => {
    if (currentSliderIndex > 0) {
      setCurrentSliderIndex(currentSliderIndex - 1);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("restaurants")
        .update({ 
          tuning_profile: values,
          tuning_completed: true 
        })
        .eq("id", restaurantId);

      if (error) throw error;

      toast.success("Your tuning profile has been saved!");
      onComplete();
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

  if (step === "intro") {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-8">
          <h1 className="text-3xl font-bold text-primary mb-6 text-center">
            Understanding Your Philosophy
          </h1>
          <div className="space-y-4 text-center mb-8">
            <p className="text-lg text-card-foreground">
              Before we go further, I need to understand <strong>YOUR</strong> philosophy for running this place.
            </p>
            <p className="text-muted-foreground">
              This 2-minute exercise is the most important thing you'll do in Shyloh—it's how 
              I learn what matters to YOU so I can give advice that actually fits your operation.
            </p>
            <div className="bg-muted/50 border border-accent/20 rounded-lg p-6 my-6">
              <p className="text-sm text-card-foreground font-semibold mb-2">
                🔐 This is what makes Shyloh YOUR advisor
              </p>
              <p className="text-sm text-muted-foreground">
                First, you'll set a 6-digit PIN to protect your tuning settings. 
                Then we'll go through 6 quick sliders to capture your operational philosophy.
              </p>
            </div>
          </div>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button 
              variant="hero" 
              onClick={() => {
                setStep("pin");
                setPinModalOpen(true);
              }}
              className="px-8"
            >
              Let's Begin
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>

        <PinInput
          open={pinModalOpen}
          onOpenChange={setPinModalOpen}
          onPinSubmit={handlePinSubmit}
          mode="set"
        />
      </div>
    );
  }

  if (step === "sliders") {
    const currentSlider = sliders[currentSliderIndex];
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="max-w-3xl w-full p-8">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">
                Slider {currentSliderIndex + 1} of {sliders.length}
              </span>
              <span className="text-sm font-semibold text-primary">
                {Math.round(((currentSliderIndex + 1) / sliders.length) * 100)}% Complete
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${((currentSliderIndex + 1) / sliders.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Slider Title & Value */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-card-foreground flex items-center gap-3">
              <span className="text-4xl">{currentSlider.emoji}</span>
              <span>{currentSlider.title}</span>
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-base text-muted-foreground">
                {getLabel(currentSlider, values[currentSlider.id])}
              </span>
              <span className="text-3xl font-bold text-primary min-w-[70px] text-right">
                {values[currentSlider.id]}
              </span>
            </div>
          </div>

          {/* Labels */}
          <div className="flex justify-between mb-4 text-sm">
            <div className="text-card-foreground max-w-[45%]">
              <span className="font-medium block mb-1">{currentSlider.leftLabel}</span>
              <span className="text-muted-foreground italic">({currentSlider.leftExample})</span>
            </div>
            <div className="text-card-foreground text-right max-w-[45%]">
              <span className="font-medium block mb-1">{currentSlider.rightLabel}</span>
              <span className="text-muted-foreground italic">({currentSlider.rightExample})</span>
            </div>
          </div>

          {/* Slider */}
          <div className="relative mb-6">
            <input
              type="range"
              min="0"
              max="100"
              value={values[currentSlider.id]}
              onChange={(e) => handleSliderChange(currentSlider.id, parseInt(e.target.value))}
              className="w-full h-3 rounded-full appearance-none cursor-pointer transition-all duration-300"
              style={{
                background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${values[currentSlider.id]}%, hsl(var(--muted)) ${values[currentSlider.id]}%, hsl(var(--muted)) 100%)`,
              }}
            />
            <style>{`
              input[type="range"]::-webkit-slider-thumb {
                appearance: none;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: hsl(var(--primary));
                border: 4px solid hsl(var(--background));
                cursor: pointer;
                transition: transform 0.2s ease;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
              }
              input[type="range"]::-webkit-slider-thumb:hover {
                transform: scale(1.15);
              }
              input[type="range"]::-webkit-slider-thumb:active {
                transform: scale(1.15);
                box-shadow: 0 0 0 12px hsla(var(--primary) / 0.2);
              }
              input[type="range"]::-moz-range-thumb {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: hsl(var(--primary));
                border: 4px solid hsl(var(--background));
                cursor: pointer;
                transition: transform 0.2s ease;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
              }
              input[type="range"]::-moz-range-thumb:hover {
                transform: scale(1.15);
              }
              input[type="range"]::-moz-range-thumb:active {
                transform: scale(1.15);
                box-shadow: 0 0 0 12px hsla(var(--primary) / 0.2);
              }
            `}</style>
          </div>

          {/* Hint */}
          <div className="bg-muted/50 border border-accent/20 rounded-lg p-4 mb-8">
            <p className="text-sm text-card-foreground">
              {getHint(currentSlider, values[currentSlider.id])}
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4 justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentSliderIndex === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button
              variant="hero"
              onClick={handleNext}
              className="px-8"
            >
              {currentSliderIndex === sliders.length - 1 ? "Review Profile" : "Next"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (step === "recap") {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="max-w-3xl w-full p-8">
          <h1 className="text-3xl font-bold text-primary mb-6 text-center">
            Your Tuning Profile
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            Here's how Shyloh will think about your restaurant. Sound right?
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {sliders.map((slider) => (
              <div key={slider.id} className="bg-muted/50 border border-accent/20 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-base font-semibold text-card-foreground flex items-center gap-2">
                    <span className="text-2xl">{slider.emoji}</span>
                    <span>{slider.title}</span>
                  </span>
                  <span className="text-xl font-bold text-primary">
                    {values[slider.id]}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {getLabel(slider, values[slider.id])}
                </p>
              </div>
            ))}
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => {
                setStep("sliders");
                setCurrentSliderIndex(0);
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="hero"
              onClick={handleSave}
              disabled={saving}
              className="px-8"
            >
              {saving ? "Saving..." : "Looks Good!"}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
};
