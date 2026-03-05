import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan: string;
  max_members: number;
  max_api_keys: number;
  created_by: string;
  created_at: string;
}

interface OrgMember {
  id: string;
  user_id: string;
  role: string;
  status: string;
  invited_email: string | null;
  accepted_at: string | null;
  created_at: string;
}

interface OrganizationState {
  organizations: Organization[];
  currentOrg: Organization | null;
  members: OrgMember[];
  loading: boolean;
  setCurrentOrg: (org: Organization | null) => void;
  createOrganization: (name: string, slug: string) => Promise<Organization | null>;
  inviteMember: (email: string, role: string) => Promise<boolean>;
  removeMember: (memberId: string) => Promise<boolean>;
  updateMemberRole: (memberId: string, role: string) => Promise<boolean>;
  refreshMembers: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationState | undefined>(undefined);

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setOrganizations([]);
      setCurrentOrg(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    const fetchOrgs = async () => {
      const { data } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        setOrganizations(data as Organization[]);
        if (!currentOrg) setCurrentOrg(data[0] as Organization);
      }
      setLoading(false);
    };

    fetchOrgs();
  }, [user]);

  const refreshMembers = async () => {
    if (!currentOrg) return;
    const { data } = await supabase
      .from("organization_members")
      .select("*")
      .eq("organization_id", currentOrg.id)
      .order("created_at", { ascending: true });

    if (data) setMembers(data as OrgMember[]);
  };

  useEffect(() => {
    refreshMembers();
  }, [currentOrg]);

  const createOrganization = async (name: string, slug: string) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("organizations")
      .insert({ name, slug, created_by: user.id })
      .select()
      .single();

    if (error) {
      console.error("Error creating org:", error);
      return null;
    }

    const org = data as Organization;
    setOrganizations((prev) => [org, ...prev]);
    setCurrentOrg(org);
    return org;
  };

  const inviteMember = async (email: string, role: string) => {
    if (!currentOrg || !user) return false;
    const { error } = await supabase.from("organization_members").insert({
      organization_id: currentOrg.id,
      user_id: user.id, // placeholder — real invite flow would use email lookup
      role,
      invited_email: email,
      invited_at: new Date().toISOString(),
      status: "invited",
    });
    if (error) {
      console.error("Error inviting member:", error);
      return false;
    }
    await refreshMembers();
    return true;
  };

  const removeMember = async (memberId: string) => {
    const { error } = await supabase
      .from("organization_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      console.error("Error removing member:", error);
      return false;
    }
    await refreshMembers();
    return true;
  };

  const updateMemberRole = async (memberId: string, role: string) => {
    const { error } = await supabase
      .from("organization_members")
      .update({ role })
      .eq("id", memberId);

    if (error) {
      console.error("Error updating role:", error);
      return false;
    }
    await refreshMembers();
    return true;
  };

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        currentOrg,
        members,
        loading,
        setCurrentOrg,
        createOrganization,
        inviteMember,
        removeMember,
        updateMemberRole,
        refreshMembers,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) throw new Error("useOrganization must be used within OrganizationProvider");
  return context;
};
