import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  MapPin,
  Plus,
  Trash2,
  RefreshCw,
  User,
  Globe,
  Crown,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface RegionAssignment {
  id: string;
  user_id: string;
  region_id: string;
  assigned_at: string;
  region?: { region_name: string; region_code: string };
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
}

interface RCIRegion {
  id: string;
  region_name: string;
  region_code: string;
}

const RegionAssignmentManager = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<RegionAssignment[]>([]);
  const [sovereignUsers, setSovereignUsers] = useState<UserRole[]>([]);
  const [regions, setRegions] = useState<RCIRegion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [assignmentsRes, usersRes, regionsRes] = await Promise.all([
        supabase
          .from("user_region_assignments")
          .select("*")
          .order("assigned_at", { ascending: false }),
        supabase
          .from("user_roles")
          .select("*")
          .in("role", ["sovereign", "admin"]),
        supabase.from("rci_regions").select("id, region_name, region_code"),
      ]);

      if (assignmentsRes.error) throw assignmentsRes.error;
      if (usersRes.error) throw usersRes.error;
      if (regionsRes.error) throw regionsRes.error;

      // Enrich assignments with region data
      const enrichedAssignments = (assignmentsRes.data || []).map((a) => ({
        ...a,
        region: regionsRes.data?.find((r) => r.id === a.region_id),
      }));

      setAssignments(enrichedAssignments);
      setSovereignUsers(usersRes.data || []);
      setRegions(regionsRes.data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignRegions = async () => {
    if (!selectedUser || selectedRegions.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select a user and at least one region.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check for existing assignments
      const existingAssignments = assignments.filter(
        (a) => a.user_id === selectedUser
      );
      const existingRegionIds = existingAssignments.map((a) => a.region_id);
      const newRegionIds = selectedRegions.filter(
        (r) => !existingRegionIds.includes(r)
      );

      if (newRegionIds.length === 0) {
        toast({
          title: "No new assignments",
          description: "User already has all selected regions assigned.",
        });
        return;
      }

      const insertData = newRegionIds.map((regionId) => ({
        user_id: selectedUser,
        region_id: regionId,
        assigned_by: user?.id,
      }));

      const { error } = await supabase
        .from("user_region_assignments")
        .insert(insertData);

      if (error) throw error;

      toast({
        title: "Regions assigned",
        description: `Assigned ${newRegionIds.length} region(s) to user.`,
      });

      setIsAssigning(false);
      setSelectedUser("");
      setSelectedRegions([]);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error assigning regions",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from("user_region_assignments")
        .delete()
        .eq("id", assignmentId);

      if (error) throw error;

      toast({
        title: "Assignment removed",
        description: "Region assignment has been removed.",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error removing assignment",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleRegionSelection = (regionId: string) => {
    setSelectedRegions((prev) =>
      prev.includes(regionId)
        ? prev.filter((r) => r !== regionId)
        : [...prev, regionId]
    );
  };

  // Group assignments by user
  const assignmentsByUser = assignments.reduce((acc, assignment) => {
    if (!acc[assignment.user_id]) {
      acc[assignment.user_id] = [];
    }
    acc[assignment.user_id].push(assignment);
    return acc;
  }, {} as Record<string, RegionAssignment[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-xl border border-border/50 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-display font-semibold text-foreground flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Region Assignments
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Assign regions to sovereign users for personalized dashboards
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isAssigning} onOpenChange={setIsAssigning}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Assign Regions
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong max-w-lg">
              <DialogHeader>
                <DialogTitle>Assign Regions to User</DialogTitle>
                <DialogDescription>
                  Select a sovereign user and the regions they should manage.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Sovereign User</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sovereignUsers.map((u) => (
                        <SelectItem key={u.user_id} value={u.user_id}>
                          <div className="flex items-center gap-2">
                            <Crown className="w-3 h-3 text-amber-500" />
                            <span className="font-mono text-sm">
                              {u.user_id.slice(0, 8)}...
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({u.role})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block">Regions</Label>
                  <div className="max-h-[200px] overflow-y-auto space-y-2 p-2 rounded-lg bg-secondary/30 border border-border/50">
                    {regions.map((region) => {
                      const isAssigned = selectedUser
                        ? assignments.some(
                            (a) =>
                              a.user_id === selectedUser &&
                              a.region_id === region.id
                          )
                        : false;

                      return (
                        <div
                          key={region.id}
                          className={`flex items-center space-x-3 p-2 rounded-lg ${
                            isAssigned ? "bg-muted/50" : "hover:bg-muted/30"
                          }`}
                        >
                          <Checkbox
                            id={region.id}
                            checked={selectedRegions.includes(region.id)}
                            disabled={isAssigned}
                            onCheckedChange={() => toggleRegionSelection(region.id)}
                          />
                          <Label
                            htmlFor={region.id}
                            className={`flex items-center gap-2 cursor-pointer ${
                              isAssigned ? "text-muted-foreground" : ""
                            }`}
                          >
                            <Globe className="w-4 h-4" />
                            <span>{region.region_name}</span>
                            <span className="text-xs font-mono text-muted-foreground">
                              ({region.region_code})
                            </span>
                            {isAssigned && (
                              <span className="text-xs text-primary">
                                Already assigned
                              </span>
                            )}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAssigning(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignRegions}
                  disabled={!selectedUser || selectedRegions.length === 0}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Assign ({selectedRegions.length})
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {Object.keys(assignmentsByUser).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No region assignments yet</p>
          <p className="text-sm mt-1">
            Assign regions to sovereign users to enable personalized dashboards
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(assignmentsByUser).map(([userId, userAssignments]) => (
            <div
              key={userId}
              className="p-4 rounded-lg bg-secondary/30 border border-border/50"
            >
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-mono text-sm">{userId.slice(0, 8)}...</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500">
                  {sovereignUsers.find((u) => u.user_id === userId)?.role || "sovereign"}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {userAssignments.length} region(s)
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {userAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border/50"
                  >
                    <Globe className="w-3 h-3 text-primary" />
                    <span className="text-sm">
                      {assignment.region?.region_name || "Unknown"}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      ({assignment.region?.region_code || "?"})
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveAssignment(assignment.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default RegionAssignmentManager;