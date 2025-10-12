import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MapPin, Tag, Pencil, Loader2, MessageCircle, RefreshCw, DollarSign, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SocraticQA from "./SocraticQA";

interface RestaurantFindingsProps {
  data: any;
  onBack: () => void;
  onUpdate: (updatedData: any) => void;
}

const RestaurantFindings = ({ data, onBack, onUpdate }: RestaurantFindingsProps) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [showQA, setShowQA] = useState(false);
  const [toastData, setToastData] = useState<any>(null);
  const [loadingToast, setLoadingToast] = useState(false);

  const handleEdit = (fieldName: string, currentValue: string) => {
    setEditingField(fieldName);
    setEditValue(currentValue);
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue("");
  };

  const handleSave = async (fieldName: string) => {
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
      onUpdate({ ...data, [fieldName]: editValue.trim() });
      setEditingField(null);
      setEditValue("");
    } catch (error) {
      console.error('Error saving:', error);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const fetchToastData = async () => {
    setLoadingToast(true);
    try {
      const { data: responseData, error } = await supabase.functions.invoke('toast-get-data');
      
      if (error) throw error;
      
      setToastData(responseData);
      toast.success("Toast POS data refreshed");
    } catch (error) {
      console.error('Error fetching Toast data:', error);
      toast.error("Failed to fetch Toast POS data");
    } finally {
      setLoadingToast(false);
    }
  }; 

  // Auto-fetch Toast data on mount
  useEffect(() => {
    fetchToastData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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

  if (showQA) {
    return <SocraticQA restaurantName={data.name} onBack={() => setShowQA(false)} />;
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-hero py-12">
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Back Button */}
          <Button
            variant="outline"
            onClick={onBack}
            className="bg-background/10 backdrop-blur-sm border-primary-foreground/20 text-primary-foreground hover:bg-background/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

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

          {/* Q&A CTA Button */}
          <div className="backdrop-blur-sm bg-accent/20 rounded-lg p-6 border border-accent/40 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-xl text-primary-foreground mb-2">
                  Deepen Your Profile
                </h3>
                <p className="text-primary-foreground/80">
                  Have a guided conversation with our AI to uncover deeper insights about your restaurant
                </p>
              </div>
              <Button
                onClick={() => setShowQA(true)}
                className="bg-accent hover:bg-accent/80 text-accent-foreground flex items-center gap-2 whitespace-nowrap"
              >
                <MessageCircle className="w-4 h-4" />
                Start Q&A Session
              </Button>
            </div>
          </div>

          {/* Toast POS Data Card */}
          <Card className="bg-background/10 backdrop-blur-sm border-primary-foreground/20 p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-primary-foreground">Toast POS Data</h3>
              <Button
                onClick={fetchToastData}
                disabled={loadingToast}
                size="sm"
                className="bg-accent hover:bg-accent/90"
              >
                {loadingToast ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>

            {!toastData && !loadingToast && (
              <p className="text-primary-foreground/60 text-center py-8">
                Click refresh to load live Toast POS data
              </p>
            )}

            {toastData && (
              <div className="space-y-6">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-accent/10 rounded-lg p-4 border border-accent/30">
                    <div className="flex items-center gap-2 mb-2">
                      <ShoppingBag className="w-5 h-5 text-accent" />
                      <span className="text-sm text-primary-foreground/70">Today's Orders</span>
                    </div>
                    <p className="text-3xl font-bold text-primary-foreground">{toastData.metrics?.orderCount || 0}</p>
                  </div>
                  <div className="bg-accent/10 rounded-lg p-4 border border-accent/30">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5 text-accent" />
                      <span className="text-sm text-primary-foreground/70">Revenue</span>
                    </div>
                    <p className="text-3xl font-bold text-primary-foreground">${toastData.metrics?.revenue || '0.00'}</p>
                  </div>
                </div>

                {/* Menu Highlights */}
                {toastData.menuHighlights && toastData.menuHighlights.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-primary-foreground mb-3">Menu Highlights</h4>
                    <div className="space-y-2">
                      {toastData.menuHighlights.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-background/20 rounded-lg p-3">
                          <span className="text-primary-foreground">{item.name}</span>
                          <span className="text-accent font-mono">${item.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sync Info */}
                <div className="text-xs text-primary-foreground/50 text-right">
                  Last synced: {new Date(toastData.lastSync).toLocaleString()}
                </div>
              </div>
            )}
          </Card>

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
  );
};

export default RestaurantFindings;
