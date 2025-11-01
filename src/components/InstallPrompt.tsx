import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const InstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) return;

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    // Listen for the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For iOS, show prompt after 3 seconds if not installed
    if (iOS) {
      setTimeout(() => setShowPrompt(true), 3000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 p-4 shadow-lg border-primary/20 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 p-2 rounded-full bg-primary/10">
          <Smartphone className="w-5 h-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1">Install Shyloh App</h3>
          <p className="text-xs text-muted-foreground mb-3">
            {isIOS 
              ? "Tap the Share button and select 'Add to Home Screen' for quick access to voice memos."
              : "Install Shyloh for instant access to voice memos and offline support."}
          </p>
          
          {!isIOS && deferredPrompt && (
            <Button onClick={handleInstall} size="sm" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Install Now
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="flex-shrink-0 -mt-1 -mr-1"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};