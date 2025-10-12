import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import RestaurantFindings from "./RestaurantFindings";

const Hero = () => {
  const [showForm, setShowForm] = useState(false);
  const [restaurantName, setRestaurantName] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [restaurantData, setRestaurantData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!restaurantName.trim() || !zipCode.trim()) {
      toast.error("Please enter both restaurant name and zip code");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .ilike('name', `%${restaurantName}%`)
        .ilike('location', `%${zipCode}%`)
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error("Restaurant not found in our database");
        setLoading(false);
        return;
      }

      setRestaurantData(data);
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      toast.error("Failed to fetch restaurant data");
    } finally {
      setLoading(false);
    }
  };

  if (restaurantData) {
    return <RestaurantFindings data={restaurantData} onBack={() => setRestaurantData(null)} />;
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 z-0 bg-gradient-hero"></div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Main Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-primary-foreground">
            Meet Shyloh
          </h1>

          {/* Tagline */}
          <p className="text-xl sm:text-2xl text-primary-foreground/90 max-w-2xl mx-auto leading-relaxed">
            We know a lot about restaurants, you know everything about yours.
          </p>

          {/* CTA Button or Form */}
          <div className="pt-4">
            {!showForm ? (
              <Button 
                variant="hero" 
                size="lg"
                onClick={() => setShowForm(true)}
                className="animate-fade-in"
              >
                Start Here
              </Button>
            ) : (
              <div className="max-w-md mx-auto space-y-4 animate-fade-in">
                <Input
                  type="text"
                  placeholder="Restaurant Name"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  className="bg-background/10 backdrop-blur-sm border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60 text-lg py-6"
                />
                <Input
                  type="text"
                  placeholder="Zip Code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="bg-background/10 backdrop-blur-sm border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60 text-lg py-6"
                />
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "Searching..." : "Continue"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl"></div>
    </section>
  );
};

export default Hero;
