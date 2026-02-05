import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Palette,
  ArrowLeft,
  Save,
  RefreshCw,
  Camera,
  Mail,
  Building,
  MapPin,
  Check,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  organization: string | null;
  country: string | null;
  avatar_url: string | null;
}

interface NotificationSettings {
  emailAlerts: boolean;
  rciThresholds: boolean;
  tokenMinting: boolean;
  weeklyDigest: boolean;
  communityUpdates: boolean;
}

const Settings = () => {
  const { user, roles, loading, signOut } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
   const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<Profile>>({});
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailAlerts: true,
    rciThresholds: true,
    tokenMinting: true,
    weeklyDigest: false,
    communityUpdates: true,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
       fetchNotificationPreferences();
    }
  }, [user]);

   const fetchNotificationPreferences = async () => {
     if (!user) return;
     try {
       const { data, error } = await supabase
         .from("user_preferences")
         .select("notification_settings")
         .eq("user_id", user.id)
         .single();
 
       if (error && error.code !== "PGRST116") throw error;
 
       if (data?.notification_settings) {
         setNotifications(data.notification_settings as unknown as NotificationSettings);
       }
     } catch (error: any) {
       console.error("Error fetching notification preferences:", error);
     }
   };
 
   const handleSaveNotifications = async () => {
     if (!user) return;
     setIsSavingNotifications(true);
     try {
       const { error } = await supabase
         .from("user_preferences")
         .upsert([{
           user_id: user.id,
           notification_settings: JSON.parse(JSON.stringify(notifications)),
           updated_at: new Date().toISOString(),
         }], {
           onConflict: "user_id",
         });
 
       if (error) throw error;
 
       toast({
         title: "Preferences Saved",
         description: "Your notification preferences have been updated.",
       });
     } catch (error: any) {
       toast({
         title: "Error saving preferences",
         description: error.message,
         variant: "destructive",
       });
     } finally {
       setIsSavingNotifications(false);
     }
   };
 
  const fetchProfile = async () => {
    setIsLoadingData(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setProfile(data);
        setEditedProfile(data);
      }
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          full_name: editedProfile.full_name,
          organization: editedProfile.organization,
          country: editedProfile.country,
          avatar_url: editedProfile.avatar_url,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id",
        });

      if (error) throw error;

      setProfile(editedProfile as Profile);
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error saving profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading || isLoadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container px-4 md:px-6 max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-muted">
                <SettingsIcon className="w-6 h-6 text-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground">
                  Settings
                </h1>
                <p className="text-muted-foreground">
                  Manage your account and preferences
                </p>
              </div>
            </div>
          </motion.div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="glass-strong">
              <TabsTrigger value="profile" className="gap-2">
                <User className="w-4 h-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <Shield className="w-4 h-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="appearance" className="gap-2">
                <Palette className="w-4 h-4" />
                Appearance
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="glass-strong border-border/50">
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your personal information and public profile
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex items-center gap-6">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={editedProfile.avatar_url || undefined} />
                        <AvatarFallback className="text-2xl">
                          {(editedProfile.full_name || user?.email || "U")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Button variant="outline" size="sm">
                          <Camera className="w-4 h-4 mr-2" />
                          Change Avatar
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          JPG, PNG or GIF. Max 2MB.
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Form Fields */}
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email
                        </Label>
                        <Input
                          id="email"
                          value={user?.email || ""}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                          Email cannot be changed
                        </p>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="name" className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Full Name
                        </Label>
                        <Input
                          id="name"
                          value={editedProfile.full_name || ""}
                          onChange={(e) =>
                            setEditedProfile({ ...editedProfile, full_name: e.target.value })
                          }
                          placeholder="Enter your full name"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="organization" className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          Organization
                        </Label>
                        <Input
                          id="organization"
                          value={editedProfile.organization || ""}
                          onChange={(e) =>
                            setEditedProfile({ ...editedProfile, organization: e.target.value })
                          }
                          placeholder="Your organization or company"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="country" className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Country
                        </Label>
                        <Input
                          id="country"
                          value={editedProfile.country || ""}
                          onChange={(e) =>
                            setEditedProfile({ ...editedProfile, country: e.target.value })
                          }
                          placeholder="Your country"
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Roles */}
                    <div>
                      <Label className="mb-3 block">Assigned Roles</Label>
                      <div className="flex flex-wrap gap-2">
                        {roles.map((role) => (
                          <Badge key={role} className="capitalize">
                            {role}
                          </Badge>
                        ))}
                        {roles.length === 0 && (
                          <span className="text-sm text-muted-foreground">No roles assigned</span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleSaveProfile} disabled={isSaving}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="glass-strong border-border/50">
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                      Choose what notifications you want to receive
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                        <div>
                          <p className="font-medium">Email Alerts</p>
                          <p className="text-sm text-muted-foreground">
                            Receive important alerts via email
                          </p>
                        </div>
                        <Switch
                          checked={notifications.emailAlerts}
                          onCheckedChange={(checked) =>
                            setNotifications({ ...notifications, emailAlerts: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                        <div>
                          <p className="font-medium">RCI Threshold Alerts</p>
                          <p className="text-sm text-muted-foreground">
                            Get notified when regions cross critical thresholds
                          </p>
                        </div>
                        <Switch
                          checked={notifications.rciThresholds}
                          onCheckedChange={(checked) =>
                            setNotifications({ ...notifications, rciThresholds: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                        <div>
                          <p className="font-medium">Token Minting</p>
                          <p className="text-sm text-muted-foreground">
                            Notifications when new tokens are minted
                          </p>
                        </div>
                        <Switch
                          checked={notifications.tokenMinting}
                          onCheckedChange={(checked) =>
                            setNotifications({ ...notifications, tokenMinting: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                        <div>
                          <p className="font-medium">Weekly Digest</p>
                          <p className="text-sm text-muted-foreground">
                            Receive a weekly summary of RCI changes
                          </p>
                        </div>
                        <Switch
                          checked={notifications.weeklyDigest}
                          onCheckedChange={(checked) =>
                            setNotifications({ ...notifications, weeklyDigest: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                        <div>
                          <p className="font-medium">Community Updates</p>
                          <p className="text-sm text-muted-foreground">
                            Updates about community challenges and activities
                          </p>
                        </div>
                        <Switch
                          checked={notifications.communityUpdates}
                          onCheckedChange={(checked) =>
                            setNotifications({ ...notifications, communityUpdates: checked })
                          }
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                       <Button onClick={handleSaveNotifications} disabled={isSavingNotifications}>
                        <Check className="w-4 h-4 mr-2" />
                         {isSavingNotifications ? "Saving..." : "Save Preferences"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card className="glass-strong border-border/50">
                  <CardHeader>
                    <CardTitle>Password</CardTitle>
                    <CardDescription>
                      Change your password to keep your account secure
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input id="current-password" type="password" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type="password" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input id="confirm-password" type="password" />
                    </div>
                    <Button>Update Password</Button>
                  </CardContent>
                </Card>

                <Card className="glass-strong border-border/50 border-destructive/50">
                  <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>
                      Irreversible actions for your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                      <div>
                        <p className="font-medium text-destructive">Sign Out</p>
                        <p className="text-sm text-muted-foreground">
                          Sign out from your account on this device
                        </p>
                      </div>
                      <Button variant="destructive" onClick={handleSignOut}>
                        Sign Out
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="glass-strong border-border/50">
                  <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>
                      Customize how Atlas Sanctum looks for you
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label className="mb-3 block">Theme</Label>
                      <div className="grid grid-cols-3 gap-4">
                        <button
                          onClick={() => setTheme("dark")}
                          className={`p-4 rounded-lg border-2 ${
                            theme === "dark" ? "border-primary" : "border-border"
                          } bg-secondary/30 cursor-pointer transition-colors hover:border-primary/50`}
                        >
                          <div className="w-full h-20 rounded bg-[hsl(220,25%,6%)] border border-border mb-2 flex items-center justify-center">
                            <Moon className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <p className="text-sm font-medium text-center">Dark</p>
                        </button>
                        <button
                          onClick={() => setTheme("light")}
                          className={`p-4 rounded-lg border-2 ${
                            theme === "light" ? "border-primary" : "border-border"
                          } bg-secondary/30 cursor-pointer transition-colors hover:border-primary/50`}
                        >
                          <div className="w-full h-20 rounded bg-[hsl(45,20%,96%)] border border-gray-200 mb-2 flex items-center justify-center">
                            <Sun className="w-6 h-6 text-gray-600" />
                          </div>
                          <p className="text-sm font-medium text-center">Light</p>
                        </button>
                        <button
                          onClick={() => setTheme("system")}
                          className={`p-4 rounded-lg border-2 ${
                            theme === "system" ? "border-primary" : "border-border"
                          } bg-secondary/30 cursor-pointer transition-colors hover:border-primary/50`}
                        >
                          <div className="w-full h-20 rounded bg-gradient-to-b from-[hsl(45,20%,96%)] to-[hsl(220,25%,6%)] border border-border mb-2 flex items-center justify-center">
                            <Monitor className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <p className="text-sm font-medium text-center">System</p>
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {theme === "system" 
                          ? `Currently using ${resolvedTheme} mode based on your system preference`
                          : `${theme.charAt(0).toUpperCase() + theme.slice(1)} mode is active`}
                      </p>
                    </div>

                    <Separator />

                    <div>
                      <Label className="mb-3 block">Dashboard Density</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg border-2 border-primary bg-secondary/30 cursor-pointer">
                          <p className="text-sm font-medium">Comfortable</p>
                          <p className="text-xs text-muted-foreground">More whitespace, larger elements</p>
                        </div>
                        <div className="p-4 rounded-lg border border-border bg-secondary/30 cursor-pointer">
                          <p className="text-sm font-medium">Compact</p>
                          <p className="text-xs text-muted-foreground">Dense layout, more data visible</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Settings;
