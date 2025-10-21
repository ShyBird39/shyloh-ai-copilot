import { useState, useEffect } from "react";
import { Users, Lock, Globe, X, UserPlus, Crown, Eye, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Participant {
  id: string;
  user_id: string;
  role: string;
  added_at: string;
  profiles: {
    email: string;
    display_name: string | null;
  };
}

interface TeamMember {
  user_id: string;
  profiles: {
    email: string;
    display_name: string | null;
  };
}

interface ConversationSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string | null;
  restaurantId: string;
  currentVisibility: string;
  onVisibilityChange: (visibility: string) => void;
}

export function ConversationSettings({
  open,
  onOpenChange,
  conversationId,
  restaurantId,
  currentVisibility,
  onVisibilityChange,
}: ConversationSettingsProps) {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [visibility, setVisibility] = useState(currentVisibility);

  useEffect(() => {
    if (open && conversationId) {
      loadParticipants();
      loadTeamMembers();
    }
  }, [open, conversationId]);

  useEffect(() => {
    setVisibility(currentVisibility);
  }, [currentVisibility]);

  const loadParticipants = async () => {
    if (!conversationId) return;

    try {
      // Get participants
      const { data: participantData, error: participantError } = await supabase
        .from("chat_conversation_participants")
        .select("id, user_id, role, added_at")
        .eq("conversation_id", conversationId)
        .order("role", { ascending: true })
        .order("added_at", { ascending: true });

      if (participantError) throw participantError;

      if (!participantData || participantData.length === 0) {
        setParticipants([]);
        return;
      }

      // Get profiles for all participants
      const userIds = participantData.map(p => p.user_id);
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, display_name")
        .in("id", userIds);

      if (profileError) throw profileError;

      // Combine data
      const participantsWithProfiles = participantData.map(p => {
        const profile = profileData?.find(prof => prof.id === p.user_id);
        return {
          ...p,
          profiles: {
            email: profile?.email || '',
            display_name: profile?.display_name || null,
          }
        };
      });

      setParticipants(participantsWithProfiles);
    } catch (error) {
      console.error("Error loading participants:", error);
      toast.error("Failed to load participants");
    }
  };

  const loadTeamMembers = async () => {
    try {
      // Get restaurant members
      const { data: memberData, error: memberError } = await supabase
        .from("restaurant_members")
        .select("user_id")
        .eq("restaurant_id", restaurantId)
        .eq("status", "active");

      if (memberError) throw memberError;

      if (!memberData || memberData.length === 0) {
        setTeamMembers([]);
        return;
      }

      // Get profiles for all members
      const userIds = memberData.map(m => m.user_id);
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, display_name")
        .in("id", userIds);

      if (profileError) throw profileError;

      // Combine data
      const membersWithProfiles = memberData.map(m => {
        const profile = profileData?.find(prof => prof.id === m.user_id);
        return {
          user_id: m.user_id,
          profiles: {
            email: profile?.email || '',
            display_name: profile?.display_name || null,
          }
        };
      });

      setTeamMembers(membersWithProfiles);
    } catch (error) {
      console.error("Error loading team members:", error);
    }
  };

  const handleAddParticipant = async (userId: string) => {
    if (!conversationId || !user) return;

    setLoading(true);
    try {
      // Add participant
      const { error: participantError } = await supabase
        .from("chat_conversation_participants")
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          role: "member",
          added_by: user.id,
        });

      if (participantError) throw participantError;

      // Get conversation title for the notification
      const { data: conversationData } = await supabase
        .from("chat_conversations")
        .select("title")
        .eq("id", conversationId)
        .single();

      // Get the user's profile for the notification message
      const { data: currentUserProfile } = await supabase
        .from("profiles")
        .select("display_name, email")
        .eq("id", user.id)
        .single();

      const addedByName = currentUserProfile?.display_name || currentUserProfile?.email || "Someone";
      const conversationTitle = conversationData?.title || "a conversation";

      // Create notification for the added user
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          restaurant_id: restaurantId,
          conversation_id: conversationId,
          message_id: conversationId, // Using conversation_id as placeholder since there's no specific message
          type: "conversation_shared",
          content: `${addedByName} added you to "${conversationTitle}"`,
          mentioned_by: user.id,
        });

      if (notificationError) {
        console.error("Error creating notification:", notificationError);
        // Don't fail the whole operation if notification fails
      }

      toast.success("Participant added");
      loadParticipants();
      setSearchQuery("");
    } catch (error: any) {
      console.error("Error adding participant:", error);
      if (error.code === "23505") {
        toast.error("User is already a participant");
      } else {
        toast.error("Failed to add participant");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("chat_conversation_participants")
        .delete()
        .eq("id", participantId);

      if (error) throw error;

      toast.success("Participant removed");
      loadParticipants();
    } catch (error) {
      console.error("Error removing participant:", error);
      toast.error("Failed to remove participant");
    } finally {
      setLoading(false);
    }
  };

  const handleVisibilityChange = async (newVisibility: string) => {
    if (!conversationId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("chat_conversations")
        .update({ visibility: newVisibility })
        .eq("id", conversationId);

      if (error) throw error;

      setVisibility(newVisibility);
      onVisibilityChange(newVisibility);
      toast.success("Visibility updated");
    } catch (error) {
      console.error("Error updating visibility:", error);
      toast.error("Failed to update visibility");
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="w-3 h-3" />;
      case "viewer":
        return <Eye className="w-3 h-3" />;
      default:
        return <User className="w-3 h-3" />;
    }
  };

  const getVisibilityIcon = (vis: string) => {
    switch (vis) {
      case "team":
        return <Users className="w-4 h-4" />;
      case "public":
        return <Globe className="w-4 h-4" />;
      default:
        return <Lock className="w-4 h-4" />;
    }
  };

  const filteredTeamMembers = teamMembers.filter(
    (member) =>
      !participants.some((p) => p.user_id === member.user_id) &&
      (member.profiles.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.profiles.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const currentUserParticipant = participants.find((p) => p.user_id === user?.id);
  const isOwner = currentUserParticipant?.role === "owner";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Conversation Settings</DialogTitle>
          <DialogDescription>
            Manage who can access this conversation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Visibility Setting */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Visibility</label>
            <Select
              value={visibility}
              onValueChange={handleVisibilityChange}
              disabled={!isOwner || loading}
            >
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {getVisibilityIcon(visibility)}
                    <span className="capitalize">{visibility}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Private</div>
                      <div className="text-xs text-muted-foreground">
                        Only invited participants
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="team">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Team</div>
                      <div className="text-xs text-muted-foreground">
                        All restaurant members
                      </div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Participants List */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Participants ({participants.length})
            </label>
            <ScrollArea className="h-48 border rounded-lg p-2">
              <div className="space-y-2">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-2 rounded hover:bg-accent"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Badge variant="outline" className="gap-1">
                        {getRoleIcon(participant.role)}
                        {participant.role}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {participant.profiles.display_name || participant.profiles.email}
                        </p>
                        {participant.profiles.display_name && (
                          <p className="text-xs text-muted-foreground truncate">
                            {participant.profiles.email}
                          </p>
                        )}
                      </div>
                    </div>
                    {isOwner && participant.role !== "owner" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveParticipant(participant.id)}
                        disabled={loading}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Add Participants */}
          {isOwner && visibility === "private" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Add Participant</label>
              <Input
                placeholder="Search team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <ScrollArea className="h-32 border rounded-lg p-2">
                  <div className="space-y-1">
                    {filteredTeamMembers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No team members found
                      </p>
                    ) : (
                      filteredTeamMembers.map((member) => (
                        <Button
                          key={member.user_id}
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => handleAddParticipant(member.user_id)}
                          disabled={loading}
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm truncate">
                              {member.profiles.display_name || member.profiles.email}
                            </p>
                            {member.profiles.display_name && (
                              <p className="text-xs text-muted-foreground truncate">
                                {member.profiles.email}
                              </p>
                            )}
                          </div>
                        </Button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}

          {!isOwner && (
            <p className="text-xs text-muted-foreground">
              Only the conversation owner can modify these settings.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
