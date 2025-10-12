import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, MapPin, Tag } from "lucide-react";

interface RestaurantFindingsProps {
  data: any;
  onBack: () => void;
}

const RestaurantFindings = ({ data, onBack }: RestaurantFindingsProps) => {
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
                <span>{data.location}</span>
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
              {dimensions.map((dimension, index) => (
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
                  <p className="text-primary-foreground/80 leading-relaxed">
                    {dimension.description}
                  </p>
                </Card>
              ))}
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
