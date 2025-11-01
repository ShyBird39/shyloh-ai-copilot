import { LogOut, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileHeaderProps {
  restaurantName: string;
  location?: string;
  onLogout: () => void;
}

export const MobileHeader = ({ restaurantName, location, onLogout }: MobileHeaderProps) => {
  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-foreground truncate">
            {restaurantName}
          </h1>
          {location && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{location}</span>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onLogout}
          className="shrink-0"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};
