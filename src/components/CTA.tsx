import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";

const CTA = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast.success("Thanks for your interest! We'll be in touch soon.");
      setEmail("");
    }
  };

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero"></div>
      <div className="absolute top-10 left-10 w-96 h-96 bg-accent/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary-glow/30 rounded-full blur-3xl"></div>
      
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl sm:text-5xl font-bold text-primary-foreground">
            Ready to Transform Your Restaurant Operations?
          </h2>
          <p className="text-xl text-primary-foreground/90">
            Join our early access program and be among the first to experience the future of restaurant intelligence.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 h-12 bg-background/10 backdrop-blur-sm border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
              required
            />
            <Button variant="accent" size="lg" type="submit" className="sm:w-auto">
              Get Early Access
            </Button>
          </form>

          <div className="pt-8 text-sm text-primary-foreground/80">
            <p>🚀 MVP launching in 8-12 weeks</p>
            <p className="mt-2">Limited spots available for founding members</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
