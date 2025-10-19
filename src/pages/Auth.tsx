import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in and redirect appropriately
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check if user has restaurant memberships
        const { data: memberships } = await supabase
          .from("restaurant_members")
          .select("restaurant_id")
          .eq("user_id", session.user.id)
          .limit(1);

        if (memberships && memberships.length > 0) {
          // Redirect to their restaurant
          navigate(`/restaurant/${memberships[0].restaurant_id}`);
        } else {
          navigate("/");
        }
      }

      // Check for invitation token in URL
      const params = new URLSearchParams(window.location.search);
      const invitationToken = params.get('invitation');
      if (invitationToken) {
        sessionStorage.setItem('pending_invitation', invitationToken);
      }
    };
    checkSession();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Check for pending invitation
        const pendingInvitation = sessionStorage.getItem('pending_invitation');
        if (pendingInvitation) {
          await handleInvitationAcceptance(pendingInvitation, data.user.id);
          return;
        }

        // Check if user has restaurant memberships
        const { data: memberships } = await supabase
          .from("restaurant_members")
          .select("restaurant_id")
          .eq("user_id", data.user.id)
          .limit(1);

        toast({
          title: "Welcome back!",
          description: "You've successfully logged in.",
        });

        if (memberships && memberships.length > 0) {
          navigate(`/restaurant/${memberships[0].restaurant_id}`);
        } else {
          navigate("/");
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              display_name: displayName,
            },
          },
        });

        if (error) throw error;

        // Check for pending invitation
        const pendingInvitation = sessionStorage.getItem('pending_invitation');
        if (pendingInvitation && data.user) {
          await handleInvitationAcceptance(pendingInvitation, data.user.id);
          return;
        }

        toast({
          title: "Account created!",
          description: "You've successfully signed up. Please log in.",
        });
        setIsLogin(true);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInvitationAcceptance = async (invitationToken: string, userId: string) => {
    try {
      const { data, error } = await supabase.rpc('accept_invitation', {
        _invitation_token: invitationToken,
        _user_id: userId,
      });

      if (error) throw error;

      sessionStorage.removeItem('pending_invitation');

      if (data && data.success) {
        toast({
          title: "Welcome to the team!",
          description: "You've been added to the restaurant.",
        });
        navigate(`/restaurant/${data.restaurant_id}`);
      } else {
        throw new Error(data?.error || 'Failed to accept invitation');
      }
    } catch (error: any) {
      toast({
        title: "Error accepting invitation",
        description: error.message,
        variant: "destructive",
      });
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isLogin ? "Welcome Back" : "Create Account"}</CardTitle>
          <CardDescription>
            {isLogin
              ? "Sign in to access your restaurant"
              : "Sign up to join your team"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
