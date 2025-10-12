import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import RestaurantFindings from "./RestaurantFindings";

const Hero = () => {
  const [showForm, setShowForm] = useState(false);
  const [restaurantName, setRestaurantName] = useState("");
  const [location, setLocation] = useState("");
  const [restaurantData, setRestaurantData] = useState<any>(null);
  const [multipleResults, setMultipleResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!restaurantName.trim()) {
      toast.error("Please enter a restaurant name");
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('restaurants')
        .select('*')
        .ilike('name', `%${restaurantName}%`);

      // Only filter by location if provided
      if (location.trim()) {
        query = query.ilike('location', `%${location}%`);
      }

      const { data, error } = await query.limit(10);

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error("Restaurant not found in our database");
        setLoading(false);
        return;
      }

      // If single result, show it directly
      if (data.length === 1) {
        setRestaurantData(data[0]);
      } else {
        // Multiple results, show selection UI
        setMultipleResults(data);
      }
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      toast.error("Failed to fetch restaurant data");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRestaurant = (restaurant: any) => {
    setRestaurantData(restaurant);
    setMultipleResults([]);
  };

  const handleBack = () => {
    setRestaurantData(null);
    setMultipleResults([]);
  };

  const handleUpdate = (updatedData: any) => {
    setRestaurantData(updatedData);
  };

  if (restaurantData) {
    return <RestaurantFindings data={restaurantData} onBack={handleBack} onUpdate={handleUpdate} />;
  }

  // Show selection UI if multiple results
  if (multipleResults.length > 0) {
    return (
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gradient-hero"></div>
        
        <div className="container relative z-10 mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <Button 
              variant="outline" 
              onClick={handleBack}
              className="mb-4"
            >
              ← Back to Search
            </Button>
            
            <h2 className="text-3xl font-bold text-primary-foreground mb-6">
              Select a Restaurant ({multipleResults.length} found)
            </h2>
            
            <div className="grid gap-4">
              {multipleResults.map((restaurant) => (
                <button
                  key={restaurant.id}
                  onClick={() => handleSelectRestaurant(restaurant)}
                  className="bg-background/10 backdrop-blur-sm border border-primary-foreground/20 rounded-lg p-6 text-left hover:bg-background/20 transition-all"
                >
                  <h3 className="text-xl font-semibold text-primary-foreground mb-2">
                    {restaurant.name}
                  </h3>
                  <p className="text-primary-foreground/80">
                    {restaurant.location} • {restaurant.category}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl"></div>
      </section>
    );
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
            We know a lot about restaurants.  You know everything about yours.
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
                  placeholder="Location/Neighborhood (optional, e.g., South End)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
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
