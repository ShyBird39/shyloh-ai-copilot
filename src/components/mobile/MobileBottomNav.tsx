import { Mic, MessageSquare, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  activeTab: 'voice' | 'chat' | 'more';
  onTabChange: (tab: 'voice' | 'chat' | 'more') => void;
}

export const MobileBottomNav = ({ activeTab, onTabChange }: MobileBottomNavProps) => {
  const tabs = [
    { id: 'voice' as const, icon: Mic, label: 'Voice Log' },
    { id: 'chat' as const, icon: MessageSquare, label: 'Chat' },
    { id: 'more' as const, icon: Menu, label: 'More' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => {
                if ('vibrate' in navigator) navigator.vibrate(30);
                onTabChange(tab.id);
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all mobile-tap-target",
                isActive 
                  ? "text-primary" 
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
