import { X, MessageSquare, Bot, CheckSquare, ClipboardList, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

interface MobileNavigationMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (section: 'chats' | 'agents' | 'tasks' | 'manager-log') => void;
  currentSection?: string;
}

export const MobileNavigationMenu = ({
  open,
  onOpenChange,
  onNavigate,
  currentSection
}: MobileNavigationMenuProps) => {
  
  const menuItems = [
    { id: 'chats' as const, label: 'Chats', icon: MessageSquare },
    { id: 'agents' as const, label: 'Agents', icon: Bot },
    { id: 'tasks' as const, label: 'Tasks', icon: CheckSquare },
    { id: 'manager-log' as const, label: 'Manager Log', icon: ClipboardList },
  ];

  const handleNavigate = (section: 'chats' | 'agents' | 'tasks' | 'manager-log') => {
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
    onNavigate(section);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[90vh]">
        <DrawerHeader className="flex items-center justify-between border-b border-border">
          <DrawerTitle className="text-xl font-semibold">Menu</DrawerTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </DrawerHeader>

        <div className="p-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={cn(
                  "w-full text-left p-4 rounded-lg transition-colors mobile-tap-target mb-2 flex items-center justify-between",
                  isActive 
                    ? 'bg-accent text-accent-foreground' 
                    : 'hover:bg-accent/20 active:bg-accent/30'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  <span className="font-medium text-base">{item.label}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
