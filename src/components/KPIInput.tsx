import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, PanelLeftClose, PanelLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface KPIInputProps {
  restaurantId: string;
  restaurantName: string;
  onBack: () => void;
  onComplete?: () => void;
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

const KPIInput = ({ restaurantId, restaurantName, onBack, onComplete }: KPIInputProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Perfect! Now that I understand your philosophy, I need a few quick numbers to power your insights. Just ballpark figures are fine—don't overthink it.",
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    textareaRef.current?.focus();
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
        onComplete?.();
      }, 2000);
    } catch (error) {
      console.error("Error saving KPIs:", error);
      toast.error("Failed to save KPIs");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex w-full">
      {/* Left Sidebar - Chat */}
      <div
        className={`${
          sidebarOpen ? "w-96" : "w-0"
        } transition-all duration-300 border-r border-accent/20 bg-background/95 backdrop-blur-sm flex flex-col overflow-hidden`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-accent/20 flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">KPI Setup Chat</h2>
            <p className="text-xs text-muted-foreground">Chat with Shyloh</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="h-8 w-8"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted/50 border border-accent/20"
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
        <div className="p-4 border-t border-accent/20">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !saving) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your answer... (Shift+Enter for new line)"
              disabled={saving}
              className="flex-1 min-h-[60px] max-h-[120px] resize-none"
            />
            <Button
              onClick={handleSend}
              disabled={saving || !currentInput.trim()}
              className="h-[60px]"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-accent/20 backdrop-blur-sm bg-background/95 flex items-center gap-4">
          {!sidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="h-8 w-8"
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={onBack}
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-foreground">{restaurantName}</h1>
            <p className="text-sm text-muted-foreground">Set Your KPI Targets</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold mb-4">Setting Up Your KPIs</h2>
                <p className="text-muted-foreground mb-8">
                  Use the chat on the left to provide your restaurant's key performance indicators.
                  This will help us provide personalized insights and recommendations.
                </p>
                <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                  <div className="p-6 rounded-lg border border-accent/20 bg-muted/50">
                    <h3 className="font-semibold mb-2">Average Weekly Sales</h3>
                    <p className="text-sm text-muted-foreground">Your typical weekly revenue</p>
                  </div>
                  <div className="p-6 rounded-lg border border-accent/20 bg-muted/50">
                    <h3 className="font-semibold mb-2">Food Cost Target</h3>
                    <p className="text-sm text-muted-foreground">Your goal food cost percentage</p>
                  </div>
                  <div className="p-6 rounded-lg border border-accent/20 bg-muted/50">
                    <h3 className="font-semibold mb-2">Labor Cost Target</h3>
                    <p className="text-sm text-muted-foreground">Your goal labor cost percentage</p>
                  </div>
                  <div className="p-6 rounded-lg border border-accent/20 bg-muted/50">
                    <h3 className="font-semibold mb-2">Sales Mix</h3>
                    <p className="text-sm text-muted-foreground">Distribution across categories</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPIInput;
