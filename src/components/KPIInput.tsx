import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send } from "lucide-react";
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

interface ChatMessage {
  role: "assistant" | "user";
  content: string;
  type?: "question" | "confirmation" | "input";
}

const KPIInput = ({ restaurantId, restaurantName, onBack }: KPIInputProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hey! 👋 I need a few quick ops numbers to personalize your analysis and make real recommendations. Just give me your best guesses if you're not 100% sure.",
      type: "question",
    },
    {
      role: "assistant",
      content: "What are your average weekly sales $? (Feel free to round)",
      type: "question",
    },
  ]);
  const [currentInput, setCurrentInput] = useState("");
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
  const [saving, setSaving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const steps = [
    {
      question: "What are your average weekly sales $? (Feel free to round)",
      field: "avg_weekly_sales",
      type: "currency",
      confirmation: (value: number) => `💰 Noted—$${(value / 1000).toFixed(0)}K/week. Strong volume.`,
    },
    {
      question: "What's your target food cost %? (Normally lands ~25–32% depending on concept. Where do you aim?)",
      field: "food_cost_goal",
      type: "percentage",
      confirmation: (value: number) => `✅ Got it—${value}% food cost target. Dialed in.`,
    },
    {
      question: "What's your target labor cost %? (Typically 28–32% for total wages + salaries. Where do you aim?)",
      field: "labor_cost_goal",
      type: "percentage",
      confirmation: (value: number) => `✓ Logged—${value}% labor cost goal. Tight but doable at your volume.`,
    },
    {
      question: "Out of every $100 in sales, roughly how much is Food?",
      field: "sales_mix_food",
      type: "percentage",
      confirmation: (value: number) => `Got it, ${value}% food.`,
    },
    {
      question: "And how much is Liquor?",
      field: "sales_mix_liquor",
      type: "percentage",
      confirmation: (value: number) => `${value}% liquor, nice.`,
    },
    {
      question: "Wine?",
      field: "sales_mix_wine",
      type: "percentage",
      confirmation: (value: number) => `${value}% wine.`,
    },
    {
      question: "Beer?",
      field: "sales_mix_beer",
      type: "percentage",
      confirmation: (value: number) => `${value}% beer.`,
    },
    {
      question: "And finally, N/A Beverages?",
      field: "sales_mix_na_bev",
      type: "percentage",
      confirmation: (value: number) => `📊 Perfect! ${value}% N/A beverages. Revenue mix captured—you're all set!`,
    },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [messages]);

  const handleSend = async () => {
    if (!currentInput.trim()) return;

    const value = parseFloat(currentInput);
    if (isNaN(value) || value <= 0) {
      toast.error("Please enter a valid number");
      return;
    }

    // Add user message
    setMessages((prev) => [
      ...prev,
      { role: "user", content: currentInput, type: "input" },
    ]);

    const currentStepData = steps[currentStep];
    const updatedKPIData = { ...kpiData, [currentStepData.field]: value };
    setKPIData(updatedKPIData);

    // Add confirmation message
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: currentStepData.confirmation(value), type: "confirmation" },
    ]);

    setCurrentInput("");

    // Move to next step or save
    if (currentStep < steps.length - 1) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: steps[currentStep + 1].question, type: "question" },
        ]);
        setCurrentStep(currentStep + 1);
      }, 500);
    } else {
      await saveKPIs();
    }
  };

  const saveKPIs = async () => {
    setSaving(true);
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "Saving your KPIs...", type: "confirmation" },
    ]);

    try {
      const { error } = await supabase
        .from("restaurant_kpis")
        .upsert({
          restaurant_id: restaurantId,
          ...kpiData,
        });

      if (error) throw error;

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "All set! 🎉 Your KPIs are saved and ready to power your insights.", type: "confirmation" },
      ]);

      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (error) {
      console.error("Error saving KPIs:", error);
      toast.error("Failed to save KPIs");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-accent/20 backdrop-blur-sm bg-background/95">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={onBack}
            size="sm"
            className="text-primary-foreground/80 hover:text-primary-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">Set Your KPI Targets</h2>
            <p className="text-sm text-muted-foreground">Chat with Shyloh to set up your operational goals</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === "user"
                    ? "bg-accent text-accent-foreground"
                    : "backdrop-blur-sm bg-background/80 border border-accent/20"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-accent/20 backdrop-blur-sm bg-background/95">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              type="number"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !saving && handleSend()}
              placeholder="Type your answer..."
              disabled={saving}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={saving || !currentInput.trim()}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPIInput;
