import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowLeft, MapPin, Tag, Pencil, Loader2, Send, PanelLeftClose, PanelLeft } from "lucide-react";
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
  const [savingKPIs, setSavingKPIs] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Fetch restaurant data
  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!id) {
        navigate('/');
        return;
      }

      try {
        const { data: restaurant, error } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (!restaurant) {
          toast.error("Restaurant not found");
          navigate('/');
          return;
        }

        setData(restaurant);
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
      {/* Left Sidebar - KPI Chat */}
      <div
        className={`${
          sidebarOpen ? "w-96" : "w-0"
        } transition-all duration-300 border-r border-accent/20 bg-background/95 backdrop-blur-sm flex flex-col overflow-hidden`}
      >
        <div className="p-4 border-b border-accent/20 flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">KPI Setup</h2>
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

        <div className="p-4 border-t border-accent/20">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              type="number"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !savingKPIs && handleSendKPI()}
              placeholder="Type your answer..."
              disabled={savingKPIs}
              className="flex-1"
            />
            <Button
              onClick={handleSendKPI}
              disabled={savingKPIs || !currentInput.trim()}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <section className="flex-1 relative overflow-hidden">
        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Back Button and Toggle */}
            <div className="flex items-center gap-2">
              {!sidebarOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(true)}
                  className="h-9 w-9"
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="bg-background/10 backdrop-blur-sm border-primary-foreground/20 text-primary-foreground hover:bg-background/20"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>

            {/* Header */}
            <div className="text-center space-y-4 animate-fade-in">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground">
                {data.name}
              </h1>
              <div className="flex items-center justify-center gap-6 text-primary-foreground/80">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span>{data.location}{data.zip_code ? ` (${data.zip_code})` : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  <span>{data.category}</span>
                </div>
              </div>
            </div>

            {/* REGGI Codes */}
            <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
              <Card className="bg-background/10 backdrop-blur-sm border-primary-foreground/20 p-6 space-y-2">
                <h3 className="text-lg font-semibold text-primary-foreground">Hex Code</h3>
                <p className="text-2xl font-mono text-accent">{data.hex_code}</p>
              </Card>
              <Card className="bg-background/10 backdrop-blur-sm border-primary-foreground/20 p-6 space-y-2">
                <h3 className="text-lg font-semibold text-primary-foreground">Augmented Hex Code</h3>
                <p className="text-2xl font-mono text-accent">{data.augmented_hex_code}</p>
              </Card>
            </div>

            {/* Dimensions */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-primary-foreground text-center">
                REGGI Dimensions
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {dimensions.map((dimension, index) => {
                  const descriptionFieldName = `${dimension.title.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_')}_description`;
                  const isEditing = editingField === descriptionFieldName;
                  
                  return (
                    <Card
                      key={index}
                      className="bg-background/10 backdrop-blur-sm border-primary-foreground/20 p-6 space-y-3 animate-fade-in hover-scale"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-lg font-semibold text-primary-foreground">
                          {dimension.title}
                        </h3>
                        <span className="text-accent font-mono text-sm">
                          {dimension.code}
                        </span>
                      </div>
                      
                      {isEditing ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="bg-background/20 border-primary-foreground/30 text-primary-foreground min-h-[100px]"
                            autoFocus
                            disabled={saving}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSave(descriptionFieldName)}
                              disabled={saving}
                              className="bg-accent hover:bg-accent/90"
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
                              className="bg-background/10 border-primary-foreground/20"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="group relative">
                          <p className="text-primary-foreground/80 leading-relaxed pr-8">
                            {dimension.description}
                          </p>
                          <button
                            onClick={() => handleEdit(descriptionFieldName, dimension.description)}
                            disabled={editingField !== null}
                            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30"
                          >
                            <Pencil className="w-4 h-4 text-primary-foreground/60 hover:text-accent" />
                          </button>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl"></div>
      </section>
    </div>
  );
};

export default RestaurantFindings;