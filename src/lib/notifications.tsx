import { toast } from "sonner";

export interface NotificationToastData {
  content: string;
  displayName: string;
  conversationId: string;
  onNavigate: (conversationId: string) => void;
}

/**
 * Shows a toast notification for @mention
 */
export const showMentionToast = (data: NotificationToastData) => {
  playNotificationSound();
  
  toast.custom(
    (t) => (
      <div className="bg-card border-4 border-destructive rounded-lg shadow-2xl p-5 min-w-[360px] max-w-[480px] animate-[shake_0.5s_ease-in-out] notification-glow-destructive">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-destructive flex items-center justify-center animate-pulse">
            <span className="text-2xl">🔔</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base text-foreground mb-2 uppercase tracking-wide">
              {data.displayName} mentioned you
            </p>
            <p className="text-sm text-foreground/80 line-clamp-3 mb-4 font-medium">
              {data.content}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  data.onNavigate(data.conversationId);
                  toast.dismiss(t);
                }}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md text-sm font-bold hover:bg-destructive/90 transition-all hover:scale-105 shadow-lg"
              >
                View Conversation →
              </button>
              <button
                onClick={() => toast.dismiss(t)}
                className="px-4 py-2 bg-muted text-muted-foreground rounded-md text-sm font-medium hover:bg-muted/80 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      duration: 12000,
      position: 'top-center',
    }
  );
};

/**
 * Shows a toast notification for conversation invite
 */
export const showInviteToast = (data: NotificationToastData) => {
  playNotificationSound();
  
  toast.custom(
    (t) => (
      <div className="bg-card border-4 border-accent rounded-lg shadow-2xl p-5 min-w-[360px] max-w-[480px] animate-[shake_0.5s_ease-in-out] notification-glow-accent">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent flex items-center justify-center animate-pulse">
            <span className="text-2xl">💬</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base text-foreground mb-2 uppercase tracking-wide">
              {data.displayName} invited you
            </p>
            <p className="text-sm text-foreground/80 line-clamp-3 mb-4 font-medium">
              {data.content}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  data.onNavigate(data.conversationId);
                  toast.dismiss(t);
                }}
                className="px-4 py-2 bg-accent text-accent-foreground rounded-md text-sm font-bold hover:bg-accent/90 transition-all hover:scale-105 shadow-lg"
              >
                View Conversation →
              </button>
              <button
                onClick={() => toast.dismiss(t)}
                className="px-4 py-2 bg-muted text-muted-foreground rounded-md text-sm font-medium hover:bg-muted/80 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      duration: 12000,
      position: 'top-center',
    }
  );
};

/**
 * Plays a notification sound if permitted - triple beep for emphasis
 */
export const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Play 3 beeps in succession for more attention
    [0, 0.2, 0.4].forEach((delay) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 900; // Slightly higher pitch
      oscillator.type = 'sine';
      
      const startTime = audioContext.currentTime + delay;
      gainNode.gain.setValueAtTime(0.4, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.15);
    });
  } catch (error) {
    // Silently fail if audio is not supported
    console.debug('Notification sound not available');
  }
};

/**
 * Request browser notification permission
 */
export const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    try {
      await Notification.requestPermission();
    } catch (error) {
      console.debug('Notification permission request failed');
    }
  }
};

/**
 * Show browser notification (when tab is inactive)
 */
export const showBrowserNotification = (title: string, body: string, onClick?: () => void) => {
  if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
    });
    
    if (onClick) {
      notification.onclick = () => {
        window.focus();
        onClick();
        notification.close();
      };
    }
  }
};
