import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface KPIInputProps {
  restaurantId: string;
  restaurantName: string;
  onBack: () => void;
}

interface KPIData {
  avg_weekly_sales: number | null;
  food_cost_goal: number | null;
  labor_cost_goal: number | null;
  sales_mix_food: number | null;
  sales_mix_liquor: number | null;
  sales_mix_wine: number | null;
  sales_mix_beer: number | null;
  sales_mix_na_bev: number | null;
}

const KPIInput = ({ restaurantId, restaurantName, onBack }: KPIInputProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [kpiData, setKPIData] = useState<KPIData>({
    avg_weekly_sales: null,
    food_cost_goal: null,
    labor_cost_goal: null,
    sales_mix_food: null,
    sales_mix_liquor: null,
    sales_mix_wine: null,
    sales_mix_beer: null,
    sales_mix_na_bev: null,
  });
  const [currentInput, setCurrentInput] = useState("");
  const [saving, setSaving] = useState(false);

  const steps = [
    {
      question: "What are your average weekly sales $ ?",
      subtext: "(Feel free to round)",
      field: "avg_weekly_sales",
      type: "currency",
      confirmation: (value: number) => `💰 Noted—$${(value / 1000).toFixed(0)}K/week. Strong volume.`,
    },
    {
      question: "What's your target food cost %?",
      subtext: "(Normally lands ~25–32% depending on concept. Where do you aim?)",
      field: "food_cost_goal",
      type: "percentage",
      confirmation: (value: number) => `✅ Got it—${value}% food cost target. Dialed in.`,
    },
    {
      question: "What's your target labor cost %?",
      subtext: "(Typically 28–32% for total wages + salaries. Where do you aim?)",
      field: "labor_cost_goal",
      type: "percentage",
      confirmation: (value: number) => `✓ Logged—${value}% labor cost goal. Tight but doable at your volume.`,
    },
    {
      question: "Out of every $100 in sales, roughly how much is:",
      subtext: "(Helps me understand your revenue mix. Just rough %s are fine.)",
      field: "sales_mix",
      type: "mix",
      items: [
        { label: "Food", field: "sales_mix_food" },
        { label: "Liquor", field: "sales_mix_liquor" },
        { label: "Wine", field: "sales_mix_wine" },
        { label: "Beer", field: "sales_mix_beer" },
        { label: "N/A Bev", field: "sales_mix_na_bev" },
      ],
      confirmation: () => "📊 Perfect! Revenue mix captured.",
    },
  ];

  const currentStepData = steps[currentStep];

  const handleNext = async () => {
    if (currentStepData.type === "mix") {
      // Validate all mix fields are filled
      const mixFields = currentStepData.items || [];
      const allFilled = mixFields.every((item) => kpiData[item.field as keyof KPIData] !== null);
      if (!allFilled) {
        toast.error("Please fill in all fields");
        return;
      }
    } else {
      const value = parseFloat(currentInput);
      if (isNaN(value) || value <= 0) {
        toast.error("Please enter a valid number");
        return;
      }
      setKPIData((prev) => ({ ...prev, [currentStepData.field]: value }));
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setCurrentInput("");
    } else {
      await saveKPIs();
    }
  };

  const saveKPIs = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("restaurant_kpis")
        .upsert({
          restaurant_id: restaurantId,
          ...kpiData,
        });

      if (error) throw error;

      toast.success("KPIs saved successfully! 🎉");
      onBack();
    } catch (error) {
      console.error("Error saving KPIs:", error);
      toast.error("Failed to save KPIs");
    } finally {
      setSaving(false);
    }
  };

  const handleMixInput = (field: string, value: string) => {
    const numValue = parseFloat(value) || null;
    setKPIData((prev) => ({ ...prev, [field]: numValue }));
  };

  return (
    <div className="min-h-screen bg-gradient-hero py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-8 text-primary-foreground/80 hover:text-primary-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="backdrop-blur-sm bg-background/95 rounded-lg p-8 border border-accent/20">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Next up: I need a few quick ops numbers to personalize analysis + make real recs.
            </h2>
            <p className="text-muted-foreground">
              These help me benchmark against industry targets. Just give me best guesses if you're not 100% sure.
            </p>
          </div>

          {/* Progress indicator */}
          <div className="flex gap-2 mb-8">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  idx <= currentStep ? "bg-accent" : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Question */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {currentStep + 1}. {currentStepData.question}
              </h3>
              <p className="text-muted-foreground text-sm">{currentStepData.subtext}</p>
            </div>

            {/* Input based on type */}
            {currentStepData.type === "mix" ? (
              <div className="space-y-4">
                {currentStepData.items?.map((item) => (
                  <div key={item.field} className="flex items-center gap-4">
                    <label className="w-24 text-foreground font-medium">{item.label}</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={kpiData[item.field as keyof KPIData] || ""}
                      onChange={(e) => handleMixInput(item.field, e.target.value)}
                      className="max-w-xs"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                {currentStepData.type === "currency" && (
                  <span className="text-2xl text-muted-foreground">$</span>
                )}
                <Input
                  type="number"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNext()}
                  placeholder="0"
                  className="text-2xl h-14 max-w-xs"
                  autoFocus
                />
                {currentStepData.type === "percentage" && (
                  <span className="text-2xl text-muted-foreground">%</span>
                )}
              </div>
            )}

            {/* Confirmation message for completed steps */}
            {currentStep > 0 && steps[currentStep - 1] && (
              <div className="flex items-start gap-2 p-4 bg-accent/10 rounded-lg border border-accent/20">
                <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground">
                  {steps[currentStep - 1].confirmation(
                    kpiData[steps[currentStep - 1].field as keyof KPIData] as number
                  )}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                onClick={handleNext}
                disabled={saving}
                className="min-w-32"
              >
                {saving ? "Saving..." : currentStep === steps.length - 1 ? "Save KPIs" : "Next"}
              </Button>
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  disabled={saving}
                >
                  Previous
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPIInput;
