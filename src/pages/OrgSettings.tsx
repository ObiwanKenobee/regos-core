import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Building2, Users, Key, Shield, Plus, Trash2, Crown, UserPlus,
  Copy, Eye, EyeOff, ToggleLeft, ToggleRight, Settings2, CreditCard
} from "lucide-react";

const OrgSettings = () => {
  const { user } = useAuth();
  const { currentOrg, members, createOrganization, inviteMember, removeMember, updateMemberRole } = useOrganization();
  const { tier, subscribed } = useSubscription();

  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);

  // API Key state
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const handleCreateOrg = async () => {
    if (!newOrgName || !newOrgSlug) return;
    setCreating(true);
    const org = await createOrganization(newOrgName, newOrgSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
    if (org) {
      toast.success("Organization created");
      setNewOrgName("");
      setNewOrgSlug("");
    } else {
      toast.error("Failed to create organization");
    }
    setCreating(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    const success = await inviteMember(inviteEmail, inviteRole);
    if (success) {
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
    } else {
      toast.error("Failed to send invitation");
    }
    setInviting(false);
  };

  const handleGenerateKey = async () => {
    if (!newKeyName || !currentOrg) return;
    setGeneratingKey(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-api-key", {
        body: { name: newKeyName, organizationId: currentOrg.id },
      });
      if (error) throw error;
      setGeneratedKey(data.key);
      setNewKeyName("");
      toast.success("API key generated — copy it now, it won't be shown again");
      // Refresh keys
      const { data: keys } = await supabase
        .from("api_keys")
        .select("*")
        .eq("organization_id", currentOrg.id)
        .order("created_at", { ascending: false });
      if (keys) setApiKeys(keys);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate key");
    }
    setGeneratingKey(false);
  };

  const handleManageBilling = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error("Could not open billing portal");
    }
  };

  // Load API keys when org changes
  useState(() => {
    if (currentOrg) {
      supabase
        .from("api_keys")
        .select("*")
        .eq("organization_id", currentOrg.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          if (data) setApiKeys(data);
        });
    }
  });

  const roleColors: Record<string, string> = {
    owner: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    admin: "bg-primary/10 text-primary border-primary/20",
    member: "bg-muted text-muted-foreground border-border",
    invited: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="container px-4 md:px-6 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" />
            Organization Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your workspace, team, API access, and billing.
          </p>
        </motion.div>

        {!currentOrg ? (
          <Card className="max-w-lg mx-auto mt-16 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Create Your Organization
              </CardTitle>
              <CardDescription>Set up a workspace to start collaborating</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Organization Name</Label>
                <Input value={newOrgName} onChange={(e) => setNewOrgName(e.target.value)} placeholder="Acme Corp" />
              </div>
              <div>
                <Label>Slug (URL-friendly identifier)</Label>
                <Input value={newOrgSlug} onChange={(e) => setNewOrgSlug(e.target.value)} placeholder="acme-corp" />
              </div>
              <Button onClick={handleCreateOrg} disabled={creating || !newOrgName || !newOrgSlug} className="w-full">
                {creating ? "Creating..." : "Create Organization"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="team" className="space-y-6">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="team" className="gap-2"><Users className="w-4 h-4" /> Team</TabsTrigger>
              <TabsTrigger value="api-keys" className="gap-2"><Key className="w-4 h-4" /> API Keys</TabsTrigger>
              <TabsTrigger value="billing" className="gap-2"><CreditCard className="w-4 h-4" /> Billing</TabsTrigger>
              <TabsTrigger value="settings" className="gap-2"><Settings2 className="w-4 h-4" /> Settings</TabsTrigger>
            </TabsList>

            {/* Team Tab */}
            <TabsContent value="team" className="space-y-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-primary" />
                    Invite Team Member
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Input
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@example.com"
                      className="flex-1"
                    />
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleInvite} disabled={inviting || !inviteEmail}>
                      {inviting ? "Sending..." : "Invite"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Team Members ({members.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/50">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                            {member.role === "owner" ? (
                              <Crown className="w-4 h-4 text-amber-400" />
                            ) : (
                              <Users className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {member.invited_email || member.user_id.slice(0, 8) + "..."}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {member.status === "invited" ? "Pending invitation" : "Active"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={roleColors[member.role] || ""}>
                            {member.role}
                          </Badge>
                          {member.role !== "owner" && member.user_id !== user?.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => removeMember(member.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {members.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No team members yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* API Keys Tab */}
            <TabsContent value="api-keys" className="space-y-6">
              {generatedKey && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-primary">New API Key Generated</p>
                        <p className="text-xs text-muted-foreground mt-1">Copy now — this won't be shown again</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedKey);
                          toast.success("Copied to clipboard");
                        }}
                      >
                        <Copy className="w-4 h-4 mr-1" /> Copy
                      </Button>
                    </div>
                    <code className="block mt-2 p-2 rounded bg-background text-sm font-mono text-foreground break-all">
                      {generatedKey}
                    </code>
                  </CardContent>
                </Card>
              )}

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-primary" />
                    Generate API Key
                  </CardTitle>
                  <CardDescription>Create keys for programmatic access to the RCI API</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Input
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g. Production Backend"
                      className="flex-1"
                    />
                    <Button onClick={handleGenerateKey} disabled={generatingKey || !newKeyName}>
                      {generatingKey ? "Generating..." : "Generate"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Active Keys ({apiKeys.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {apiKeys.map((key) => (
                      <div key={key.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/50">
                        <div>
                          <p className="text-sm font-medium text-foreground">{key.name}</p>
                          <p className="text-xs font-mono text-muted-foreground">{key.key_prefix}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{key.usage_count?.toLocaleString() || 0} requests</span>
                          <Badge variant={key.is_active ? "default" : "secondary"}>
                            {key.is_active ? "Active" : "Disabled"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {apiKeys.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No API keys yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing" className="space-y-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-display font-bold text-foreground capitalize">
                        {tier || "Steward"} Plan
                      </p>
                      <p className="text-muted-foreground mt-1">
                        {subscribed ? "Active subscription" : "Free tier"}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={handleManageBilling}>
                        Manage Billing
                      </Button>
                      <Button asChild>
                        <a href="/pricing">Upgrade</a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Organization Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input value={currentOrg.name} readOnly />
                  </div>
                  <div>
                    <Label>Slug</Label>
                    <Input value={currentOrg.slug} readOnly />
                  </div>
                  <div>
                    <Label>Plan</Label>
                    <Input value={currentOrg.plan} readOnly />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </main>
  );
};

export default OrgSettings;
