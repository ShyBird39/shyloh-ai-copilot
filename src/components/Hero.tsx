import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const Hero = () => {
  const [showForm, setShowForm] = useState(false);

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
                  className="bg-background/10 backdrop-blur-sm border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60 text-lg py-6"
                />
                <Input
                  type="text"
                  placeholder="Zip Code"
                  className="bg-background/10 backdrop-blur-sm border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60 text-lg py-6"
                />
                <Button variant="hero" size="lg" className="w-full">
                  Continue
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
