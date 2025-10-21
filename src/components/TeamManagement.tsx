import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserPlus, Trash2, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  display_name: string;
  role: string;
  invited_at: string;
}

interface TeamManagementProps {
  restaurantId: string;
}

export function TeamManagement({ restaurantId }: TeamManagementProps) {
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("member");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);

  useEffect(() => {
    loadMembers();
  }, [restaurantId]);

  const loadMembers = async () => {
    try {
      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from("restaurant_members")
        .select("id, user_id, invited_at")
        .eq("restaurant_id", restaurantId)
        .eq("status", "active");

      if (membersError) throw membersError;

      if (!membersData || membersData.length === 0) {
        setMembers([]);
        return;
      }

      // Fetch profiles for these users
      const userIds = membersData.map(m => m.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, display_name")
        .in("id", userIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
      }

      // Fetch roles for these users
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("restaurant_id", restaurantId)
        .in("user_id", userIds);

      if (rolesError) {
        console.error("Error fetching roles:", rolesError);
      }

      // Create maps for easy lookup
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      const rolesMap = new Map(rolesData?.map(r => [r.user_id, r.role]) || []);

      const formattedMembers = membersData.map((member: any) => {
        const profile = profilesMap.get(member.user_id);
        return {
          id: member.id,
          user_id: member.user_id,
          email: profile?.email || "Unknown",
          display_name: profile?.display_name || profile?.email || "Unknown User",
          role: rolesMap.get(member.user_id) || "member",
          invited_at: member.invited_at,
        } as TeamMember;
      });

      setMembers(formattedMembers);
    } catch (error: any) {
      toast({
        title: "Error loading team",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    try {
      // Get restaurant name
      const { data: restaurant, error: restaurantError } = await supabase
        .from("restaurants")
        .select("name")
        .eq("id", restaurantId)
        .single();

      if (restaurantError) throw restaurantError;

      // Send invitation email via edge function
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('send-team-invitation', {
        body: {
          email: inviteEmail,
          restaurantId,
          restaurantName: restaurant.name,
          role: inviteRole,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Failed to send invitation");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Invitation sent!",
        description: `An invitation email has been sent to ${inviteEmail}.`,
      });

      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("member");
      loadMembers();
    } catch (error: any) {
      const friendlyMessage = (error?.message || "").includes("non-2xx")
        ? "Invitation couldn't be emailed because the email service domain isn't verified yet. For testing, only eli@shybird.com is allowed. Please verify your domain at resend.com/domains or invite that address."
        : error.message;
      toast({
        title: "Error sending invitation",
        description: friendlyMessage,
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("restaurant_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast({
        title: "Member removed",
        description: "Team member has been removed successfully.",
      });

      loadMembers();
    } catch (error: any) {
      toast({
        title: "Error removing member",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="p-4">Loading team...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Team Members</h3>
        </div>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your restaurant team
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Note: Until email domain is verified, only invitations to eli@shybird.com will send. Verify your domain to invite others.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleInviteMember}>Send Invitation</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="h-[300px]">
        <div className="space-y-2">
          {members.map((member) => (
            <Card key={member.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{member.display_name}</p>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                  <p className="text-xs text-muted-foreground capitalize mt-1">
                    {member.role}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveMember(member.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
          {members.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No team members yet. Invite someone to get started!
            </p>
          )}
        </div>
      </ScrollArea>

      {/* Signup Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invitation Link Ready</DialogTitle>
            <DialogDescription>
              This user doesn't have an account yet. Send them this link to sign up:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={inviteLink || ""}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                onClick={() => {
                  if (inviteLink) {
                    navigator.clipboard.writeText(inviteLink);
                    toast({
                      title: "Link copied!",
                      description: "Invitation link has been copied to clipboard.",
                    });
                  }
                }}
              >
                Copy
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Once {inviteEmail} signs up, you can invite them again to add them to your team.
            </p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowLinkDialog(false);
                setInviteLink(null);
                setInviteEmail("");
                setInviteRole("member");
              }}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
