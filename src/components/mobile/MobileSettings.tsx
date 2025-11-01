import { useState } from "react";
import { ChevronRight, Building2, BookOpen, Users, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MobileSettingsProps {
  restaurantId: string;
  onOpenTuning: () => void;
}

type SettingsSection = 'main' | 'restaurant' | 'knowledge' | 'team' | 'profile';

export const MobileSettings = ({ restaurantId, onOpenTuning }: MobileSettingsProps) => {
  const [currentSection, setCurrentSection] = useState<SettingsSection>('main');

  const navigateToSection = (section: SettingsSection) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
    setCurrentSection(section);
  };

  const navigateBack = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
    setCurrentSection('main');
  };

  if (currentSection === 'main') {
    return (
      <div className="h-full overflow-y-auto p-4 space-y-3">
        <h2 className="text-2xl font-semibold mb-6 px-2">Settings</h2>
        
        <Card 
          className="p-4 mobile-tap-target cursor-pointer hover:bg-accent/10 transition-colors"
          onClick={() => navigateToSection('restaurant')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-primary" />
              <div>
                <h3 className="font-semibold">My Restaurant</h3>
                <p className="text-sm text-muted-foreground">KPIs, REGGI, Tools</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>

        <Card 
          className="p-4 mobile-tap-target cursor-pointer hover:bg-accent/10 transition-colors"
          onClick={() => navigateToSection('knowledge')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-primary" />
              <div>
                <h3 className="font-semibold">Knowledge Base</h3>
                <p className="text-sm text-muted-foreground">Files, Rules, Prompts</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>

        <Card 
          className="p-4 mobile-tap-target cursor-pointer hover:bg-accent/10 transition-colors"
          onClick={() => navigateToSection('team')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <div>
                <h3 className="font-semibold">Team</h3>
                <p className="text-sm text-muted-foreground">Manage your team</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>

        <Card 
          className="p-4 mobile-tap-target cursor-pointer hover:bg-accent/10 transition-colors"
          onClick={() => navigateToSection('profile')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-6 w-6 text-primary" />
              <div>
                <h3 className="font-semibold">Profile</h3>
                <p className="text-sm text-muted-foreground">Your preferences</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={navigateBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-semibold">
          {currentSection === 'restaurant' && 'My Restaurant'}
          {currentSection === 'knowledge' && 'Knowledge Base'}
          {currentSection === 'team' && 'Team'}
          {currentSection === 'profile' && 'Profile'}
        </h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {currentSection === 'restaurant' && (
            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-2">Restaurant Settings</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure your restaurant details and preferences
                </p>
                <Button variant="outline" className="w-full" onClick={onOpenTuning}>
                  Open Restaurant Settings
                </Button>
              </Card>
            </div>
          )}

          {currentSection === 'knowledge' && (
            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-2">Knowledge Base</h3>
                <p className="text-sm text-muted-foreground">
                  Manage files, custom rules, and prompts
                </p>
              </Card>
            </div>
          )}

          {currentSection === 'team' && (
            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-2">Team Management</h3>
                <p className="text-sm text-muted-foreground">
                  Manage team members and permissions
                </p>
              </Card>
            </div>
          )}

          {currentSection === 'profile' && (
            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-2">Your Profile</h3>
                <p className="text-sm text-muted-foreground">
                  Update your preferences and settings
                </p>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
