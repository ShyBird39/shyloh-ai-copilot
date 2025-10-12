import { Button } from "@/components/ui/button";

const Hero = () => {
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

          {/* CTA Button */}
          <div className="pt-4">
            <Button variant="hero" size="lg">
              Start Here
            </Button>
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
