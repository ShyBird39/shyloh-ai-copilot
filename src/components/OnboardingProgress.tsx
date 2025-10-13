import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface OnboardingStep {
  id: string;
  label: string;
  completed: boolean;
  active: boolean;
}

interface OnboardingProgressProps {
  steps: OnboardingStep[];
  currentStep: number;
}

export function OnboardingProgress({ steps, currentStep }: OnboardingProgressProps) {
  const completedSteps = steps.filter(s => s.completed).length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  return (
    <div className="border-b border-accent/20 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="space-y-3">
          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-primary-foreground">Getting Started</span>
              <span className="text-primary-foreground/60">
                Step {currentStep} of {steps.length}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-1.5" />
          </div>

          {/* Step Indicators */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap transition-all",
                  step.completed && "bg-primary/10 text-primary-foreground",
                  step.active && !step.completed && "bg-accent/20 text-primary-foreground",
                  !step.active && !step.completed && "bg-background/40 text-primary-foreground/40"
                )}
              >
                {step.completed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                ) : step.active ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                ) : (
                  <Circle className="w-3.5 h-3.5" />
                )}
                <span className="font-medium">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
