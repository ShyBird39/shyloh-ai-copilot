import { Card } from "@/components/ui/card";
import { MessageSquare, LineChart, Zap, Link2 } from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "AI Onboarding (REGGI)",
    description: "Conversational onboarding that learns your restaurant's unique needs and goals in minutes.",
    gradient: "from-primary to-primary-glow",
  },
  {
    icon: LineChart,
    title: "Personalized Dashboard",
    description: "Real-time insights tailored to your operations, showing what matters most to your business.",
    gradient: "from-accent to-accent-glow",
  },
  {
    icon: Zap,
    title: "Automated Insights",
    description: "AI-powered recommendations that help you reduce costs and increase profitability automatically.",
    gradient: "from-primary-glow to-accent",
  },
  {
    icon: Link2,
    title: "POS Integration",
    description: "Seamless connection with major POS providers for automatic data sync and analysis.",
    gradient: "from-accent-glow to-primary",
  },
];

const Features = () => {
  return (
    <section className="py-24 bg-gradient-feature">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Grow Your Restaurant
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful features designed specifically for small restaurant operators
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className="p-8 shadow-card hover:shadow-glow transition-all duration-300 border-border/50 hover:scale-105 group"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
