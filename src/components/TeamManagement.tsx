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

  useEffect(() => {
    loadMembers();
  }, [restaurantId]);

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("restaurant_members")
        .select(`
          id,
          user_id,
          invited_at,
          profiles!inner(email, display_name),
          user_roles!inner(role)
        `)
        .eq("restaurant_id", restaurantId)
        .eq("status", "active");

      if (error) throw error;

      const formattedMembers = data?.map((member: any) => ({
        id: member.id,
        user_id: member.user_id,
        email: member.profiles.email,
        display_name: member.profiles.display_name || member.profiles.email,
        role: member.user_roles[0]?.role || "member",
        invited_at: member.invited_at,
      })) || [];

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
      // First, check if user exists with this email
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", inviteEmail)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile) {
        // User doesn't exist yet - show signup link
        toast({
          title: "Invitation Ready",
          description: `Send this signup link to ${inviteEmail}: ${window.location.origin}/auth`,
        });
        setInviteDialogOpen(false);
        setInviteEmail("");
        setInviteRole("member");
        return;
      }

      // User exists - add them directly
      const { data: { user } } = await supabase.auth.getUser();
      
      // Add to restaurant_members
      const { error: memberError } = await supabase
        .from("restaurant_members")
        .insert({
          restaurant_id: restaurantId,
          user_id: profile.id,
          invited_by: user?.id,
          status: "active",
        });

      if (memberError) throw memberError;

      // Add to user_roles
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: profile.id,
          restaurant_id: restaurantId,
          role: inviteRole,
        });

      if (roleError) throw roleError;

      toast({
        title: "Team member added",
        description: `${inviteEmail} has been added to your team.`,
      });

      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("member");
      loadMembers();
    } catch (error: any) {
      toast({
        title: "Error adding team member",
        description: error.message,
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
    </div>
  );
}
