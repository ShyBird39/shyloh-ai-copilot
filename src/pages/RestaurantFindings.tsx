import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { LogOut, MapPin, Tag, Pencil, Loader2, Send, PanelLeftClose, PanelLeft, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

const RestaurantFindings = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  
  // KPI Chat state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [promptsVisible, setPromptsVisible] = useState(true);
  const [hasCompletedKPIs, setHasCompletedKPIs] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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
  const [savingKPIs, setSavingKPIs] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const samplePrompts = [
    "I am here to...",
    "Check my vitals...",
    "Tips for using Shyloh"
  ];

  const handlePromptClick = (promptText: string) => {
    setCurrentInput(promptText);
    inputRef.current?.focus();
  };

  const steps = [
    {
      question: "What are your average weekly sales $? (Feel free to round)",
      field: "avg_weekly_sales" as keyof KPIData,
      type: "currency",
      confirmation: (value: number) => `💰 Noted—$${(value / 1000).toFixed(0)}K/week. Strong volume.`,
    },
    {
      question: "What's your target food cost %? (Normally lands ~25–32% depending on concept. Where do you aim?)",
      field: "food_cost_goal" as keyof KPIData,
      type: "percentage",
      confirmation: (value: number) => `✅ Got it—${value}% food cost target. Dialed in.`,
    },
    {
      question: "What's your target labor cost %? (Typically 28–32% for total wages + salaries. Where do you aim?)",
      field: "labor_cost_goal" as keyof KPIData,
      type: "percentage",
      confirmation: (value: number) => `✓ Logged—${value}% labor cost goal. Tight but doable at your volume.`,
    },
    {
      question: "Out of every $100 in sales, roughly how much is Food?",
      field: "sales_mix_food" as keyof KPIData,
      type: "percentage",
      confirmation: (value: number) => `Got it, ${value}% food.`,
    },
    {
      question: "And how much is Liquor?",
      field: "sales_mix_liquor" as keyof KPIData,
      type: "percentage",
      confirmation: (value: number) => `${value}% liquor, nice.`,
    },
    {
      question: "Wine?",
      field: "sales_mix_wine" as keyof KPIData,
      type: "percentage",
      confirmation: (value: number) => `${value}% wine.`,
    },
    {
      question: "Beer?",
      field: "sales_mix_beer" as keyof KPIData,
      type: "percentage",
      confirmation: (value: number) => `${value}% beer.`,
    },
    {
      question: "And finally, N/A Beverages?",
      field: "sales_mix_na_bev" as keyof KPIData,
      type: "percentage",
      confirmation: (value: number) => `📊 Perfect! ${value}% N/A beverages. Revenue mix captured—you're all set!`,
    },
  ];

  // Fetch restaurant data and KPIs
  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!id) {
        navigate('/');
        return;
      }

      try {
        // Fetch restaurant data
        const { data: restaurant, error: restaurantError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', id)
          .single();

        if (restaurantError) throw restaurantError;

        if (!restaurant) {
          toast.error("Restaurant not found");
          navigate('/');
          return;
        }

        setData(restaurant);

        // Check if KPIs exist
        const { data: existingKPIs, error: kpisError } = await supabase
          .from('restaurant_kpis')
          .select('*')
          .eq('restaurant_id', id)
          .maybeSingle();

        if (kpisError) {
          console.error('Error fetching KPIs:', kpisError);
        }

        if (existingKPIs) {
          // Returning user - has KPIs
          setHasCompletedKPIs(true);
          setKPIData({
            avg_weekly_sales: existingKPIs.avg_weekly_sales,
            food_cost_goal: existingKPIs.food_cost_goal,
            labor_cost_goal: existingKPIs.labor_cost_goal,
            sales_mix_food: existingKPIs.sales_mix_food,
            sales_mix_liquor: existingKPIs.sales_mix_liquor,
            sales_mix_wine: existingKPIs.sales_mix_wine,
            sales_mix_beer: existingKPIs.sales_mix_beer,
            sales_mix_na_bev: existingKPIs.sales_mix_na_bev,
          });
          setMessages([
            {
              role: "assistant",
              content: "Welcome back! I'm here to help you explore your restaurant's data and insights. What would you like to know?",
              type: "question",
            },
          ]);
        } else {
          // First-time user - no KPIs
          setHasCompletedKPIs(false);
          setMessages([
            {
              role: "assistant",
              content: "First things first, I am a restaurant intelligence tool. I don't have all the answers by any means, but through conversation, hopefully the two of us have more of them. I know a lot about restaurants but just a little bit about yours. This initial conversation is meant to help me learn more. That way I can be more helpful to you going forward.",
              type: "question",
            },
            {
              role: "assistant",
              content: "What are your average weekly sales $? (Feel free to round)",
              type: "question",
            },
          ]);
        }
      } catch (error) {
        console.error('Error fetching restaurant:', error);
        toast.error("Failed to load restaurant data");
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [id, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (sidebarOpen) {
      inputRef.current?.focus();
    }
  }, [messages, sidebarOpen]);

  const handleSendKPI = async () => {
    if (!currentInput.trim()) return;

    const value = parseFloat(currentInput);
    if (isNaN(value) || value <= 0) {
      toast.error("Please enter a valid number");
      return;
    }

    setMessages((prev) => [
      ...prev,
      { role: "user", content: currentInput, type: "input" },
    ]);

    const currentStepData = steps[currentStep];
    const updatedKPIData = { ...kpiData, [currentStepData.field]: value };
    setKPIData(updatedKPIData);

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: currentStepData.confirmation(value), type: "confirmation" },
    ]);

    setCurrentInput("");

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
    if (!data) return;

    setSavingKPIs(true);
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "Saving your KPIs...", type: "confirmation" },
    ]);

    try {
      const { error } = await supabase
        .from("restaurant_kpis")
        .upsert({
          restaurant_id: data.id,
          ...kpiData,
        });

      if (error) throw error;

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "All set! 🎉 Your KPIs are saved and ready to power your insights.", type: "confirmation" },
      ]);

      toast.success("KPIs saved successfully");
    } catch (error) {
      console.error("Error saving KPIs:", error);
      toast.error("Failed to save KPIs");
    } finally {
      setSavingKPIs(false);
    }
  };

  const handleEdit = (fieldName: string, currentValue: string) => {
    setEditingField(fieldName);
    setEditValue(currentValue);
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue("");
  };

  const handleSave = async (fieldName: string) => {
    if (!data) return;

    if (!editValue.trim()) {
      toast.error("Description cannot be empty");
      return;
    }

    if (editValue.length > 2000) {
      toast.error("Description must be less than 2000 characters");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ [fieldName]: editValue.trim() })
        .eq('id', data.id);

      if (error) throw error;

      toast.success("Changes saved successfully");
      setData({ ...data, [fieldName]: editValue.trim() });
      setEditingField(null);
      setEditValue("");
    } catch (error) {
      console.error('Error saving:', error);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-foreground" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const dimensions = [
    {
      title: "Culinary & Beverage",
      code: data.culinary_beverage_code,
      description: data.culinary_beverage_description,
    },
    {
      title: "Vibe & Energy",
      code: data.vibe_energy_code,
      description: data.vibe_energy_description,
    },
    {
      title: "Social Context",
      code: data.social_context_code,
      description: data.social_context_description,
    },
    {
      title: "Time & Occasion",
      code: data.time_occasion_code,
      description: data.time_occasion_description,
    },
    {
      title: "Operational Execution",
      code: data.operational_execution_code,
      description: data.operational_execution_description,
    },
    {
      title: "Hospitality Approach",
      code: data.hospitality_approach_code,
      description: data.hospitality_approach_description,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero flex w-full">
      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-accent/20 bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-primary-foreground">{data.name}</h1>
                <p className="text-xs text-primary-foreground/60">{data.location} • {data.category}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/')}
                  className="text-primary-foreground hover:bg-background/20"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="bg-background/10 backdrop-blur-sm border-primary-foreground/20 text-primary-foreground hover:bg-background/20"
                >
                  {sidebarOpen ? <PanelLeftClose className="w-4 h-4 mr-2" /> : <PanelLeft className="w-4 h-4 mr-2" />}
                  Vitals
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Quick Start Prompts */}
        <Collapsible 
          open={promptsVisible} 
          onOpenChange={setPromptsVisible}
          className="border-b border-accent/20 bg-background/50 backdrop-blur-sm"
        >
          <div className="container mx-auto px-4 py-3 max-w-4xl">
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors mb-3">
              {promptsVisible ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Quick Start Prompts
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="flex flex-wrap gap-2">
                {samplePrompts.map((prompt, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="rounded-full px-4 py-2 h-auto bg-background/80 border-accent/20 text-primary-foreground/80 hover:bg-background hover:text-primary-foreground hover:border-accent/40 transition-all"
                    onClick={() => handlePromptClick(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="space-y-6">
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl p-4 ${
                      message.role === "user"
                        ? "bg-accent text-accent-foreground"
                        : "bg-background/50 backdrop-blur-sm border border-accent/20 text-primary-foreground"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Input Area - Sticky at bottom */}
        <div className="sticky bottom-0 z-10 border-t border-accent/20 bg-background/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 max-w-4xl">
            <div className="flex gap-3">
              <Input
                ref={inputRef}
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !savingKPIs && handleSendKPI()}
                placeholder="Type your answer..."
                disabled={savingKPIs}
                className="flex-1 bg-background/50 border-accent/30 text-foreground placeholder:text-muted-foreground"
              />
              <Button
                onClick={handleSendKPI}
                disabled={savingKPIs || !currentInput.trim()}
                size="icon"
                className="h-10 w-10"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Restaurant Details */}
      <div
        className={`${
          sidebarOpen ? "w-96" : "w-0"
        } transition-all duration-300 border-l border-accent/20 bg-background/95 backdrop-blur-sm overflow-hidden`}
      >
        <div className="h-full overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* REGGI Codes */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-primary-foreground uppercase tracking-wide">REGGI Codes</h3>
              <Card className="bg-background/50 border-accent/20 p-4 space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Hex Code</p>
                  <p className="text-lg font-mono text-accent">{data.hex_code}</p>
                </div>
                <div className="pt-2 border-t border-accent/10">
                  <p className="text-xs text-muted-foreground">Augmented</p>
                  <p className="text-lg font-mono text-accent">{data.augmented_hex_code}</p>
                </div>
              </Card>
            </div>

            {/* Dimensions */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-primary-foreground uppercase tracking-wide">Dimensions</h3>
              <div className="space-y-3">
                {dimensions.map((dimension, index) => {
                  const descriptionFieldName = `${dimension.title.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_')}_description`;
                  const isEditing = editingField === descriptionFieldName;
                  
                  return (
                    <Card
                      key={index}
                      className="bg-background/50 border-accent/20 p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-primary-foreground">
                          {dimension.title}
                        </h4>
                        <span className="text-accent font-mono text-xs">
                          {dimension.code}
                        </span>
                      </div>
                      
                      {isEditing ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="bg-background/20 border-accent/30 text-primary-foreground min-h-[80px] text-sm"
                            autoFocus
                            disabled={saving}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSave(descriptionFieldName)}
                              disabled={saving}
                              className="bg-accent hover:bg-accent/90 text-xs h-7"
                            >
                              {saving ? (
                                <>
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                "Save"
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancel}
                              disabled={saving}
                              className="text-xs h-7 bg-background/10 border-primary-foreground/20"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-primary-foreground/70 text-xs leading-relaxed">
                            {dimension.description || "No description provided"}
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(descriptionFieldName, dimension.description || "")}
                            className="text-accent hover:text-accent-foreground hover:bg-accent/20 -ml-2 text-xs h-7"
                          >
                            <Pencil className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        </>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantFindings;