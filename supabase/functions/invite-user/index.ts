import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "No autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      return new Response(
        JSON.stringify({ success: false, error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if requesting user is admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .single();

    if (roleData?.role !== "admin") {
      return new Response(
        JSON.stringify({ success: false, error: "Solo los administradores pueden invitar usuarios" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get request body
    const { email, fullName, role } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: "El email es requerido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // IMPORTANT:
    // - Do NOT call createUser() before inviteUserByEmail(); that causes "already registered".
    // - Do NOT fallback to resetPasswordForEmail(); that double-sends and quickly hits rate limits.

    const origin = req.headers.get("origin") ?? "https://gfigueroa.lovable.app";
    const redirectTo = origin; // keep it simple; the app can route from the root

    // Invite user using Supabase's built-in email (creates user if needed)
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo,
        data: {
          full_name: fullName || email,
        },
      }
    );

    if (inviteError) {
      console.error("Invite email error:", inviteError);

      // Give more accurate status codes for the frontend UX
      const status = (inviteError as any)?.status ?? 400;
      return new Response(
        JSON.stringify({ success: false, error: inviteError.message, code: (inviteError as any)?.code }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If role is admin, update the user_roles table for the invited user
    if (role === "admin" && inviteData?.user) {
      // Wait a moment for triggers to create profile/role rows
      await new Promise((resolve) => setTimeout(resolve, 500));

      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .update({ role: "admin" })
        .eq("user_id", inviteData.user.id);

      if (roleError) {
        console.error("Role update error:", roleError);
      }
    }

    console.log("Invite sent (Supabase):", inviteData?.user?.id, "redirectTo:", redirectTo);

    return new Response(
      JSON.stringify({ success: true, user: inviteData?.user, emailSent: true, redirectTo }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
