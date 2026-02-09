import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  is_active: boolean | null;
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, is_active")
        .eq("is_active", true)
        .order("full_name");

      if (!error && data) {
        setProfiles(data);
      }
      setLoading(false);
    };

    fetchProfiles();
  }, []);

  const getProfileName = (userId: string | null): string | null => {
    if (!userId) return null;
    const profile = profiles.find((p) => p.user_id === userId);
    return profile?.full_name || null;
  };

  return { profiles, loading, getProfileName };
}
