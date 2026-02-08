import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Upload,
  FileText,
  Link as LinkIcon,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Region {
  id: string;
  region_name: string;
  region_code: string;
}

interface ResearchSubmissionProps {
  regions: Region[];
  userId: string;
  onSubmissionComplete?: () => void;
}

const dataTypes = [
  { value: "land", label: "Land Capacity", description: "Forest cover, soil health, biodiversity" },
  { value: "ocean", label: "Ocean Capacity", description: "Marine ecosystems, fisheries, coral reefs" },
  { value: "health", label: "Human Health", description: "Public health metrics, healthcare access" },
  { value: "circular", label: "Circular Economy", description: "Recycling rates, waste reduction" },
];

export const ResearchSubmission = ({
  regions,
  userId,
  onSubmissionComplete,
}: ResearchSubmissionProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    region_id: "",
    data_type: "",
    title: "",
    description: "",
    methodology: "",
    evidence_urls: "",
    estimated_impact: "",
  });

  const handleSubmit = async () => {
    if (!formData.region_id || !formData.data_type || !formData.title) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const evidenceUrls = formData.evidence_urls
        ? formData.evidence_urls.split(",").map((url) => url.trim()).filter(Boolean)
        : [];

      const { error } = await supabase.from("verification_requests").insert({
        region_id: formData.region_id,
        credit_type: formData.data_type,
        credit_amount: parseFloat(formData.estimated_impact) || 0,
        description: `${formData.title}\n\n${formData.description}\n\nMethodology: ${formData.methodology}`,
        evidence_urls: evidenceUrls,
        created_by: userId,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Research Submitted",
        description: "Your research data has been submitted for verification.",
      });

      setIsDialogOpen(false);
      setFormData({
        region_id: "",
        data_type: "",
        title: "",
        description: "",
        methodology: "",
        evidence_urls: "",
        estimated_impact: "",
      });
      
      onSubmissionComplete?.();
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="glass-strong border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Research Submissions
            </CardTitle>
            <CardDescription>
              Submit new research findings for peer review and verification
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Submission
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Submit Research Data</DialogTitle>
                <DialogDescription>
                  Submit new research findings that contribute to RCI methodology
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Region *</Label>
                    <Select
                      value={formData.region_id}
                      onValueChange={(v) => setFormData({ ...formData, region_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((region) => (
                          <SelectItem key={region.id} value={region.id}>
                            {region.region_name} ({region.region_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Data Type *</Label>
                    <Select
                      value={formData.data_type}
                      onValueChange={(v) => setFormData({ ...formData, data_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {dataTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <p className="font-medium">{type.label}</p>
                              <p className="text-xs text-muted-foreground">{type.description}</p>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Research Title *</Label>
                  <Input
                    placeholder="e.g., Forest Regeneration Impact Study 2026"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe your research findings and key insights..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Methodology</Label>
                  <Textarea
                    placeholder="Describe the methodology used for data collection and analysis..."
                    value={formData.methodology}
                    onChange={(e) => setFormData({ ...formData, methodology: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Evidence URLs (comma-separated)</Label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        placeholder="https://paper1.pdf, https://data.csv"
                        value={formData.evidence_urls}
                        onChange={(e) => setFormData({ ...formData, evidence_urls: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Estimated Impact Score</Label>
                    <Input
                      type="number"
                      placeholder="0-100"
                      value={formData.estimated_impact}
                      onChange={(e) => setFormData({ ...formData, estimated_impact: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Research"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-border bg-secondary/20">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium">Pending Review</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Submissions awaiting peer review and verification
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-secondary/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Verified</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Research verified and contributing to RCI scores
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-secondary/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium">Needs Revision</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Submissions requiring additional data or clarification
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResearchSubmission;
