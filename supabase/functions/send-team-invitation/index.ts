import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  restaurantId: string;
  restaurantName: string;
  role?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!supabaseUrl || !supabaseKey || !resendApiKey) {
      throw new Error("Missing configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { email, restaurantId, restaurantName, role = "member" }: InvitationRequest = await req.json();

    console.log("Sending invitation to:", email, "for restaurant:", restaurantId);

    // Delete any existing pending invitations for this email/restaurant combo
    const { error: deleteError } = await supabase
      .from("restaurant_invitations")
      .delete()
      .eq("restaurant_id", restaurantId)
      .eq("email", email)
      .eq("status", "pending");

    if (deleteError) {
      console.error("Error deleting old invitations:", deleteError);
      // Continue anyway - the insert will fail if there's a non-pending one
    }

    // Create invitation in database
    const { data: invitation, error: inviteError } = await supabase
      .from("restaurant_invitations")
      .insert({
        email,
        restaurant_id: restaurantId,
        invited_by: user.id,
        role,
      })
      .select()
      .single();

    if (inviteError) {
      console.error("Error creating invitation:", inviteError);
      
      // Provide user-friendly error messages
      if (inviteError.code === "23505") {
        throw new Error("An active invitation already exists for this email. Please wait for them to accept or contact support.");
      }
      throw new Error(inviteError.message);
    }

    const invitationToken = invitation.invitation_token;
    const appUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovableproject.com") || "https://app.yourdomain.com";
    const invitationUrl = `${appUrl}/auth?invitation=${invitationToken}`;

    // Send email using Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Shyloh Team <onboarding@resend.dev>",
        to: [email],
        subject: `You've been invited to join ${restaurantName}`,
        html: `
          <h1>You've been invited!</h1>
          <p>You've been invited to join <strong>${restaurantName}</strong> on Shyloh.</p>
          <p>Click the button below to accept the invitation and create your account (or sign in if you already have one):</p>
          <p style="margin: 30px 0;">
            <a href="${invitationUrl}" 
               style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Accept Invitation
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
          <p style="color: #666; font-size: 14px; word-break: break-all;">${invitationUrl}</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">This invitation will expire in 7 days.</p>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Resend API error:", errorData);
      
      // Provide helpful error for domain verification
      if (errorData.includes("verify a domain") || errorData.includes("validation_error")) {
        throw new Error(
          "Email service requires domain verification. For testing, invitations can only be sent to eli@shybird.com. " +
          "To send to other addresses, please verify your domain at resend.com/domains."
        );
      }
      
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const emailData = await emailResponse.json();
    console.log("Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        invitation,
        emailResponse: emailData 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-team-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
