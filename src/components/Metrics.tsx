import { Card } from "@/components/ui/card";
import { TrendingUp, Users, Clock, Target } from "lucide-react";

const metrics = [
  {
    icon: Users,
    value: "75%",
    label: "Weekly Active Users",
    description: "Target engagement rate",
    color: "text-primary",
  },
  {
    icon: TrendingUp,
    value: "NPS > 50",
    label: "Customer Satisfaction",
    description: "Industry-leading score",
    color: "text-accent",
  },
  {
    icon: Clock,
    value: "99.5%",
    label: "Uptime Guarantee",
    description: "Always available",
    color: "text-primary-glow",
  },
  {
    icon: Target,
    value: "3+",
    label: "POS Partnerships",
    description: "Seamless integrations",
    color: "text-accent-glow",
  },
];

const Metrics = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Built for{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Success
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Our success metrics ensure we deliver real value to your restaurant
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Card
                key={index}
                className="p-6 text-center shadow-card hover:shadow-glow transition-all duration-300 border-border/50 group"
              >
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Icon className={`w-8 h-8 ${metric.color}`} />
                  </div>
                </div>
                <div className={`text-3xl font-bold mb-2 ${metric.color}`}>
                  {metric.value}
                </div>
                <div className="font-semibold text-foreground mb-1">
                  {metric.label}
                </div>
                <div className="text-sm text-muted-foreground">
                  {metric.description}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Metrics;
