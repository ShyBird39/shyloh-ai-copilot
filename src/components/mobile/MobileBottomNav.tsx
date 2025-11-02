import { Mic, MessageSquare, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  activeTab: 'chat' | 'voice' | 'text';
  onTabChange: (tab: 'chat' | 'voice' | 'text') => void;
}

export const MobileBottomNav = ({ activeTab, onTabChange }: MobileBottomNavProps) => {
  const tabs = [
    { id: 'chat' as const, icon: MessageSquare, label: 'Chat' },
    { id: 'voice' as const, icon: Mic, label: 'Voice Log' },
    { id: 'text' as const, icon: FileText, label: 'Text Log' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 safe-area-inset-bottom">
      <div className="grid grid-cols-3 items-stretch h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => {
                if ('vibrate' in navigator) navigator.vibrate(30);
                onTabChange(tab.id);
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full transition-all mobile-tap-target relative",
                isActive 
                  ? "text-primary before:absolute before:top-0 before:left-1/2 before:-translate-x-1/2 before:w-12 before:h-1 before:bg-primary before:rounded-b-full" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn(
                "h-6 w-6 transition-all duration-200", 
                isActive && "scale-110"
              )} />
              <span className={cn(
                "text-xs font-medium transition-all duration-200",
                isActive && "font-semibold"
              )}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
