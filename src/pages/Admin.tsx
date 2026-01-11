import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Shield,
  Globe,
  Users,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Save,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

interface RCIRegion {
  id: string;
  region_code: string;
  region_name: string;
  rci_score: number;
  land_capacity: number | null;
  ocean_capacity: number | null;
  human_capacity: number | null;
  circular_capacity: number | null;
  rci_trend: string | null;
  last_updated: string | null;
}

interface UserRole {
  id: string;
  user_id: string;
  role: "sovereign" | "investor" | "scientist" | "community" | "admin";
  created_at: string;
  email?: string;
}

const Admin = () => {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();
  const [regions, setRegions] = useState<RCIRegion[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [editingRegion, setEditingRegion] = useState<RCIRegion | null>(null);
  const [isAddingRegion, setIsAddingRegion] = useState(false);
  const [newRegion, setNewRegion] = useState<Partial<RCIRegion>>({
    region_code: "",
    region_name: "",
    rci_score: 0,
    land_capacity: 0,
    ocean_capacity: 0,
    human_capacity: 0,
    circular_capacity: 0,
    rci_trend: "stable",
  });

  const isAdmin = roles.includes("admin");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (!loading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You need admin privileges to access this page.",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [user, roles, loading, navigate, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      // Fetch RCI regions
      const { data: regionsData, error: regionsError } = await supabase
        .from("rci_regions")
        .select("*")
        .order("region_name");

      if (regionsError) throw regionsError;
      setRegions(regionsData || []);

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });

      if (rolesError) throw rolesError;
      setUserRoles(rolesData || []);
    } catch (error: any) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSaveRegion = async () => {
    if (!editingRegion) return;

    try {
      const { error } = await supabase
        .from("rci_regions")
        .update({
          region_name: editingRegion.region_name,
          rci_score: editingRegion.rci_score,
          land_capacity: editingRegion.land_capacity,
          ocean_capacity: editingRegion.ocean_capacity,
          human_capacity: editingRegion.human_capacity,
          circular_capacity: editingRegion.circular_capacity,
          rci_trend: editingRegion.rci_trend,
          last_updated: new Date().toISOString(),
        })
        .eq("id", editingRegion.id);

      if (error) throw error;

      toast({
        title: "Region updated",
        description: `${editingRegion.region_name} has been updated successfully.`,
      });

      setEditingRegion(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error updating region",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddRegion = async () => {
    if (!newRegion.region_code || !newRegion.region_name) {
      toast({
        title: "Validation Error",
        description: "Region code and name are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("rci_regions").insert({
        region_code: newRegion.region_code,
        region_name: newRegion.region_name,
        rci_score: newRegion.rci_score || 0,
        land_capacity: newRegion.land_capacity || 0,
        ocean_capacity: newRegion.ocean_capacity || 0,
        human_capacity: newRegion.human_capacity || 0,
        circular_capacity: newRegion.circular_capacity || 0,
        rci_trend: newRegion.rci_trend || "stable",
      });

      if (error) throw error;

      toast({
        title: "Region added",
        description: `${newRegion.region_name} has been added successfully.`,
      });

      setIsAddingRegion(false);
      setNewRegion({
        region_code: "",
        region_name: "",
        rci_score: 0,
        land_capacity: 0,
        ocean_capacity: 0,
        human_capacity: 0,
        circular_capacity: 0,
        rci_trend: "stable",
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error adding region",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteRegion = async (region: RCIRegion) => {
    if (!confirm(`Are you sure you want to delete ${region.region_name}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("rci_regions")
        .delete()
        .eq("id", region.id);

      if (error) throw error;

      toast({
        title: "Region deleted",
        description: `${region.region_name} has been deleted.`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error deleting region",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole as any })
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Role updated",
        description: "User role has been updated successfully.",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getTrendIcon = (trend: string | null) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="w-4 h-4 text-primary" />;
      case "declining":
        return <TrendingDown className="w-4 h-4 text-destructive" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (loading || isLoadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container px-4 md:px-6">
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
              <div className="p-3 rounded-xl bg-primary/10">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground">
                  Admin Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Manage RCI regional data and user roles
                </p>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <Tabs defaultValue="regions" className="space-y-6">
            <TabsList className="glass-strong">
              <TabsTrigger value="regions" className="gap-2">
                <Globe className="w-4 h-4" />
                RCI Regions
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <Users className="w-4 h-4" />
                User Roles
              </TabsTrigger>
            </TabsList>

            {/* RCI Regions Tab */}
            <TabsContent value="regions">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-strong rounded-xl border border-border/50 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-display font-semibold text-foreground">
                    RCI Regions ({regions.length})
                  </h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchData}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                    <Dialog open={isAddingRegion} onOpenChange={setIsAddingRegion}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Region
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="glass-strong">
                        <DialogHeader>
                          <DialogTitle>Add New Region</DialogTitle>
                          <DialogDescription>
                            Add a new region to the RCI database.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="code">Region Code</Label>
                              <Input
                                id="code"
                                value={newRegion.region_code}
                                onChange={(e) =>
                                  setNewRegion({ ...newRegion, region_code: e.target.value.toUpperCase() })
                                }
                                placeholder="US, EU, etc."
                              />
                            </div>
                            <div>
                              <Label htmlFor="name">Region Name</Label>
                              <Input
                                id="name"
                                value={newRegion.region_name}
                                onChange={(e) =>
                                  setNewRegion({ ...newRegion, region_name: e.target.value })
                                }
                                placeholder="United States"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="rci_score">RCI Score</Label>
                              <Input
                                id="rci_score"
                                type="number"
                                value={newRegion.rci_score}
                                onChange={(e) =>
                                  setNewRegion({ ...newRegion, rci_score: parseFloat(e.target.value) || 0 })
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor="trend">Trend</Label>
                              <Select
                                value={newRegion.rci_trend || "stable"}
                                onValueChange={(value) =>
                                  setNewRegion({ ...newRegion, rci_trend: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="improving">Improving</SelectItem>
                                  <SelectItem value="stable">Stable</SelectItem>
                                  <SelectItem value="declining">Declining</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="land">Land Capacity</Label>
                              <Input
                                id="land"
                                type="number"
                                value={newRegion.land_capacity ?? 0}
                                onChange={(e) =>
                                  setNewRegion({ ...newRegion, land_capacity: parseFloat(e.target.value) || 0 })
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor="ocean">Ocean Capacity</Label>
                              <Input
                                id="ocean"
                                type="number"
                                value={newRegion.ocean_capacity ?? 0}
                                onChange={(e) =>
                                  setNewRegion({ ...newRegion, ocean_capacity: parseFloat(e.target.value) || 0 })
                                }
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="human">Human Capacity</Label>
                              <Input
                                id="human"
                                type="number"
                                value={newRegion.human_capacity ?? 0}
                                onChange={(e) =>
                                  setNewRegion({ ...newRegion, human_capacity: parseFloat(e.target.value) || 0 })
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor="circular">Circular Capacity</Label>
                              <Input
                                id="circular"
                                type="number"
                                value={newRegion.circular_capacity ?? 0}
                                onChange={(e) =>
                                  setNewRegion({ ...newRegion, circular_capacity: parseFloat(e.target.value) || 0 })
                                }
                              />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddingRegion(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddRegion}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Region
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div className="rounded-lg border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/30">
                        <TableHead>Code</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead className="text-right">RCI Score</TableHead>
                        <TableHead className="text-right">Land</TableHead>
                        <TableHead className="text-right">Ocean</TableHead>
                        <TableHead className="text-right">Human</TableHead>
                        <TableHead className="text-right">Circular</TableHead>
                        <TableHead>Trend</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {regions.map((region) => (
                        <TableRow key={region.id} className="hover:bg-secondary/20">
                          <TableCell className="font-mono font-medium">
                            {region.region_code}
                          </TableCell>
                          <TableCell>{region.region_name}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {region.rci_score.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-right">
                            {region.land_capacity?.toFixed(1) ?? "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {region.ocean_capacity?.toFixed(1) ?? "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {region.human_capacity?.toFixed(1) ?? "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {region.circular_capacity?.toFixed(1) ?? "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {getTrendIcon(region.rci_trend)}
                              <span className="text-sm capitalize">
                                {region.rci_trend || "stable"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setEditingRegion(region)}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="glass-strong">
                                  <DialogHeader>
                                    <DialogTitle>Edit Region</DialogTitle>
                                    <DialogDescription>
                                      Update {editingRegion?.region_name} data.
                                    </DialogDescription>
                                  </DialogHeader>
                                  {editingRegion && (
                                    <div className="grid gap-4 py-4">
                                      <div>
                                        <Label htmlFor="edit-name">Region Name</Label>
                                        <Input
                                          id="edit-name"
                                          value={editingRegion.region_name}
                                          onChange={(e) =>
                                            setEditingRegion({
                                              ...editingRegion,
                                              region_name: e.target.value,
                                            })
                                          }
                                        />
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label htmlFor="edit-rci">RCI Score</Label>
                                          <Input
                                            id="edit-rci"
                                            type="number"
                                            value={editingRegion.rci_score}
                                            onChange={(e) =>
                                              setEditingRegion({
                                                ...editingRegion,
                                                rci_score: parseFloat(e.target.value) || 0,
                                              })
                                            }
                                          />
                                        </div>
                                        <div>
                                          <Label htmlFor="edit-trend">Trend</Label>
                                          <Select
                                            value={editingRegion.rci_trend || "stable"}
                                            onValueChange={(value) =>
                                              setEditingRegion({
                                                ...editingRegion,
                                                rci_trend: value,
                                              })
                                            }
                                          >
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="improving">Improving</SelectItem>
                                              <SelectItem value="stable">Stable</SelectItem>
                                              <SelectItem value="declining">Declining</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label htmlFor="edit-land">Land Capacity</Label>
                                          <Input
                                            id="edit-land"
                                            type="number"
                                            value={editingRegion.land_capacity ?? 0}
                                            onChange={(e) =>
                                              setEditingRegion({
                                                ...editingRegion,
                                                land_capacity: parseFloat(e.target.value) || 0,
                                              })
                                            }
                                          />
                                        </div>
                                        <div>
                                          <Label htmlFor="edit-ocean">Ocean Capacity</Label>
                                          <Input
                                            id="edit-ocean"
                                            type="number"
                                            value={editingRegion.ocean_capacity ?? 0}
                                            onChange={(e) =>
                                              setEditingRegion({
                                                ...editingRegion,
                                                ocean_capacity: parseFloat(e.target.value) || 0,
                                              })
                                            }
                                          />
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label htmlFor="edit-human">Human Capacity</Label>
                                          <Input
                                            id="edit-human"
                                            type="number"
                                            value={editingRegion.human_capacity ?? 0}
                                            onChange={(e) =>
                                              setEditingRegion({
                                                ...editingRegion,
                                                human_capacity: parseFloat(e.target.value) || 0,
                                              })
                                            }
                                          />
                                        </div>
                                        <div>
                                          <Label htmlFor="edit-circular">Circular Capacity</Label>
                                          <Input
                                            id="edit-circular"
                                            type="number"
                                            value={editingRegion.circular_capacity ?? 0}
                                            onChange={(e) =>
                                              setEditingRegion({
                                                ...editingRegion,
                                                circular_capacity: parseFloat(e.target.value) || 0,
                                              })
                                            }
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  <DialogFooter>
                                    <Button
                                      variant="outline"
                                      onClick={() => setEditingRegion(null)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button onClick={handleSaveRegion}>
                                      <Save className="w-4 h-4 mr-2" />
                                      Save Changes
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDeleteRegion(region)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </motion.div>
            </TabsContent>

            {/* User Roles Tab */}
            <TabsContent value="users">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-strong rounded-xl border border-border/50 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-display font-semibold text-foreground">
                    User Roles ({userRoles.length})
                  </h2>
                  <Button variant="outline" size="sm" onClick={fetchData}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>

                <div className="rounded-lg border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/30">
                        <TableHead>User ID</TableHead>
                        <TableHead>Current Role</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userRoles.map((userRole) => (
                        <TableRow key={userRole.id} className="hover:bg-secondary/20">
                          <TableCell className="font-mono text-sm">
                            {userRole.user_id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                userRole.role === "admin"
                                  ? "bg-primary/20 text-primary"
                                  : userRole.role === "sovereign"
                                  ? "bg-amber-warm/20 text-amber-warm"
                                  : "bg-secondary text-muted-foreground"
                              }`}
                            >
                              {userRole.role}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(userRole.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Select
                              value={userRole.role}
                              onValueChange={(value) =>
                                handleUpdateUserRole(userRole.user_id, value)
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="community">Community</SelectItem>
                                <SelectItem value="scientist">Scientist</SelectItem>
                                <SelectItem value="investor">Investor</SelectItem>
                                <SelectItem value="sovereign">Sovereign</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Admin;
