import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { showMentionToast, showInviteToast, requestNotificationPermission, showBrowserNotification } from "@/lib/notifications";

interface Notification {
  id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  conversation_id: string;
  mentioned_by: string;
  type: string;
  profiles?: {
    display_name: string;
    email: string;
  };
}

interface NotificationBellProps {
  restaurantId: string;
  onNavigate: (conversationId: string) => void;
}

export function NotificationBell({ restaurantId, onNavigate }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMentions, setUnreadMentions] = useState(0);
  const [unreadInvites, setUnreadInvites] = useState(0);
  const [open, setOpen] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);

  useEffect(() => {
    loadNotifications();
    requestNotificationPermission();
    
    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `restaurant_id=eq.${restaurantId}`
      }, async (payload) => {
        const newNotif = payload.new as Notification;
        
        // Fetch profile for the new notification
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, email')
          .eq('id', newNotif.mentioned_by)
          .single();
        
        const displayName = profile?.display_name || profile?.email || 'Someone';
        
        // Show toast notification
        if (newNotif.type === 'mention') {
          showMentionToast({
            content: newNotif.content,
            displayName,
            conversationId: newNotif.conversation_id,
            onNavigate,
          });
          showBrowserNotification(
            `${displayName} mentioned you`,
            newNotif.content,
            () => onNavigate(newNotif.conversation_id)
          );
        } else if (newNotif.type === 'conversation_shared') {
          showInviteToast({
            content: newNotif.content,
            displayName,
            conversationId: newNotif.conversation_id,
            onNavigate,
          });
          showBrowserNotification(
            'New conversation invite',
            newNotif.content,
            () => onNavigate(newNotif.conversation_id)
          );
        }
        
        // Trigger bounce animation
        setHasNewNotification(true);
        setTimeout(() => setHasNewNotification(false), 1000);
        
        loadNotifications();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `restaurant_id=eq.${restaurantId}`
      }, () => {
        loadNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, onNavigate]);

  const loadNotifications = async () => {
    // Fetch notifications
    const { data: notificationsData, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (notifError || !notificationsData) {
      console.error('Error loading notifications:', notifError);
      return;
    }

    // Fetch profiles for mentioned users
    const mentionedUserIds = [...new Set(notificationsData.map(n => n.mentioned_by))];
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, display_name, email')
      .in('id', mentionedUserIds);

    if (profilesError) {
      console.error('Error loading profiles:', profilesError);
    }

    // Merge profiles into notifications
    const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
    const enrichedNotifications = notificationsData.map(notif => ({
      ...notif,
      profiles: profilesMap.get(notif.mentioned_by)
    }));

    setNotifications(enrichedNotifications as any);
    const unread = enrichedNotifications.filter(n => !n.is_read);
    setUnreadCount(unread.length);
    setUnreadMentions(unread.filter(n => n.type === 'mention').length);
    setUnreadInvites(unread.filter(n => n.type === 'conversation_shared').length);
  };

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);
    
    loadNotifications();
  };

  const markAllAsRead = async () => {
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('restaurant_id', restaurantId)
      .eq('is_read', false);
    
    loadNotifications();
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    onNavigate(notification.conversation_id);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className={`w-6 h-6 ${hasNewNotification ? 'animate-[shake_0.5s_ease-in-out]' : ''} ${unreadMentions > 0 ? 'text-destructive' : ''}`} />
          {unreadCount > 0 && (
            <Badge 
              className={`absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold border-2 border-background ${
                unreadMentions > 0 
                  ? 'bg-destructive text-destructive-foreground notification-pulse shadow-lg shadow-destructive/50' 
                  : 'bg-accent text-accent-foreground notification-pulse shadow-lg shadow-accent/50'
              }`}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="p-2">
              {notifications.map(notif => (
                <button
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`w-full text-left p-3 rounded-lg hover:bg-accent transition-colors ${
                    !notif.is_read ? 'bg-accent/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!notif.is_read && (
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {notif.type === 'conversation_shared' 
                          ? notif.content
                          : `${notif.profiles?.display_name || notif.profiles?.email} mentioned you`
                        }
                      </p>
                      {notif.type === 'mention' && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {notif.content}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
