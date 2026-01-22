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
    const { data: claimsData, error: claimsError } = await supabaseAdmin.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Claims error:", claimsError);
      return new Response(
        JSON.stringify({ success: false, error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const requestingUserId = claimsData.claims.sub;

    // Check if requesting user is admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUserId)
      .single();

    if (roleData?.role !== "admin") {
      return new Response(
        JSON.stringify({ success: false, error: "Solo los administradores pueden ver usuarios" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all auth users with admin API
    const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error("List users error:", listError);
      return new Response(
        JSON.stringify({ success: false, error: listError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) {
      console.error("Profiles error:", profilesError);
      return new Response(
        JSON.stringify({ success: false, error: profilesError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get roles
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("*");

    if (rolesError) {
      console.error("Roles error:", rolesError);
      return new Response(
        JSON.stringify({ success: false, error: rolesError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Combine data
    const users = (profiles || []).map((profile) => {
      const authUser = authUsers.users.find((u) => u.id === profile.user_id);
      const userRole = roles?.find((r) => r.user_id === profile.user_id);
      
      return {
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name,
        email: authUser?.email || "",
        is_active: profile.is_active,
        created_at: profile.created_at,
        role: userRole?.role || "user",
      };
    });

    console.log(`Listed ${users.length} users`);

    return new Response(
      JSON.stringify({ success: true, users }),
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
