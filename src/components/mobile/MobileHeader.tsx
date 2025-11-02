import { LogOut, MapPin, Menu, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileHeaderProps {
  restaurantName?: string;
  userName?: string;
  location?: string;
  onLogout: () => void;
  showMenuButton?: boolean;
  onMenuClick?: () => void;
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export const MobileHeader = ({ 
  restaurantName,
  userName,
  location, 
  onLogout,
  showMenuButton = false,
  onMenuClick,
  title,
  showBackButton = false,
  onBackClick
}: MobileHeaderProps) => {
  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="w-10">
          {showBackButton && onBackClick ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBackClick}
              className="shrink-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          ) : showMenuButton && onMenuClick ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="shrink-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
          ) : null}
        </div>

        <div className="flex-1 min-w-0 text-center">
          <h1 className="text-lg font-semibold text-foreground truncate">
            {title || restaurantName || userName || 'Shyloh AI'}
          </h1>
          {!title && location && (
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{location}</span>
            </div>
          )}
        </div>

        <div className="w-10 flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            className="shrink-0"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
