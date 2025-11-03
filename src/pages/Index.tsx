import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Hero from "@/components/Hero";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [checkingMembership, setCheckingMembership] = useState(true);

  useEffect(() => {
    const checkRestaurantMembership = async () => {
      if (authLoading) return;
      
      if (!user) {
        setCheckingMembership(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('restaurant_members')
          .select('restaurant_id')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking membership:', error);
        }

        if (data?.restaurant_id) {
          navigate(`/restaurant/${data.restaurant_id}`);
          return;
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setCheckingMembership(false);
      }
    };

    checkRestaurantMembership();
  }, [user, authLoading, navigate]);

  if (authLoading || checkingMembership) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Hero />
    </div>
  );
};

export default Index;
