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
      <div className="bg-card border-2 border-destructive rounded-lg shadow-lg p-4 min-w-[320px] max-w-[400px]">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
            <span className="text-lg">🔔</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground mb-1">
              {data.displayName} mentioned you
            </p>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {data.content}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  data.onNavigate(data.conversationId);
                  toast.dismiss(t);
                }}
                className="px-3 py-1.5 bg-destructive text-destructive-foreground rounded-md text-xs font-medium hover:bg-destructive/90 transition-colors"
              >
                View Conversation
              </button>
              <button
                onClick={() => toast.dismiss(t)}
                className="px-3 py-1.5 bg-muted text-muted-foreground rounded-md text-xs font-medium hover:bg-muted/80 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      duration: 8000,
      position: 'top-right',
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
      <div className="bg-card border-2 border-accent rounded-lg shadow-lg p-4 min-w-[320px] max-w-[400px]">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
            <span className="text-lg">💬</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground mb-1">
              {data.displayName} invited you to a conversation
            </p>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {data.content}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  data.onNavigate(data.conversationId);
                  toast.dismiss(t);
                }}
                className="px-3 py-1.5 bg-accent text-accent-foreground rounded-md text-xs font-medium hover:bg-accent/90 transition-colors"
              >
                View Conversation
              </button>
              <button
                onClick={() => toast.dismiss(t)}
                className="px-3 py-1.5 bg-muted text-muted-foreground rounded-md text-xs font-medium hover:bg-muted/80 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      duration: 8000,
      position: 'top-right',
    }
  );
};

/**
 * Plays a notification sound if permitted
 */
export const playNotificationSound = () => {
  try {
    // Create a simple beep using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
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
