import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Book,
  Search,
  Play,
  FileText,
  Code,
  Lightbulb,
  Globe,
  Shield,
  Coins,
  Users,
  BarChart3,
  Layers,
  ArrowRight,
  ExternalLink,
  CheckCircle,
  Leaf,
  Waves,
  Heart,
  Recycle,
} from "lucide-react";
import Navbar from "@/components/Navbar";

interface DocSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  articles: { title: string; description: string }[];
}

const Documentation = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const docSections: DocSection[] = [
    {
      id: "getting-started",
      title: "Getting Started",
      description: "Learn the basics of Atlas Sanctum",
      icon: <Play className="w-5 h-5" />,
      articles: [
        { title: "What is Atlas Sanctum?", description: "Introduction to the Regenerative Operating System" },
        { title: "Creating Your Account", description: "Step-by-step account setup guide" },
        { title: "Understanding Roles", description: "Learn about Sovereign, Investor, Scientist, and Community roles" },
        { title: "Dashboard Overview", description: "Navigate the main dashboard interface" },
      ],
    },
    {
      id: "rci-methodology",
      title: "RCI Methodology",
      description: "Deep dive into Regenerative Capacity Index",
      icon: <BarChart3 className="w-5 h-5" />,
      articles: [
        { title: "What is RCI?", description: "Understanding the Regenerative Capacity Index" },
        { title: "Land Capacity", description: "Measuring terrestrial regenerative potential" },
        { title: "Ocean Capacity", description: "Assessing marine ecosystem health" },
        { title: "Human Capacity", description: "Evaluating community health and wellbeing" },
        { title: "Circular Capacity", description: "Tracking circular economy metrics" },
      ],
    },
    {
      id: "impact-tokens",
      title: "Impact Tokens",
      description: "Guide to regenerative impact tokens",
      icon: <Coins className="w-5 h-5" />,
      articles: [
        { title: "Token Overview", description: "Introduction to impact token types" },
        { title: "Minting Process", description: "How tokens are created through verification" },
        { title: "Token Valuation", description: "Understanding token economics" },
        { title: "Portfolio Management", description: "Managing your token holdings" },
      ],
    },
    {
      id: "verification",
      title: "Verification System",
      description: "Multi-signature verification workflow",
      icon: <Shield className="w-5 h-5" />,
      articles: [
        { title: "Verification Overview", description: "How the verification process works" },
        { title: "Submitting Requests", description: "Creating verification requests" },
        { title: "Signing Process", description: "Multi-signature approval workflow" },
        { title: "Evidence Requirements", description: "What evidence is needed" },
      ],
    },
    {
      id: "data-sources",
      title: "Data Sources",
      description: "Connect and manage data pipelines",
      icon: <Code className="w-5 h-5" />,
      articles: [
        { title: "Supported Sources", description: "Types of data sources available" },
        { title: "API Integration", description: "Connecting external APIs" },
        { title: "Sensor Data", description: "IoT and sensor data ingestion" },
        { title: "Satellite Data", description: "Earth observation data sources" },
      ],
    },
    {
      id: "architecture",
      title: "System Architecture",
      description: "Technical architecture overview",
      icon: <Layers className="w-5 h-5" />,
      articles: [
        { title: "6-Layer Stack", description: "Understanding the RegOS architecture" },
        { title: "Layer 0: Ontological", description: "Ethical and philosophical foundations" },
        { title: "Layer 1: Governance", description: "Ethical governance systems" },
        { title: "Layer 2: Value Exchange", description: "Regenerative value mechanisms" },
      ],
    },
  ];

  const faqs = [
    {
      question: "What is the Regenerative Capacity Index (RCI)?",
      answer: "The RCI is a comprehensive metric that measures a region's capacity to regenerate and sustain its natural and human systems. It combines four key dimensions: Land Capacity (terrestrial ecosystems), Ocean Capacity (marine health), Human Capacity (community wellbeing), and Circular Capacity (circular economy metrics).",
    },
    {
      question: "How are Impact Tokens minted?",
      answer: "Impact Tokens are minted through a rigorous verification process. Sovereigns or scientists submit verification requests with evidence of regenerative activities. These requests require multiple signatures from authorized validators. Once approved, tokens are automatically minted and credited to the relevant accounts.",
    },
    {
      question: "What roles are available in the system?",
      answer: "Atlas Sanctum supports five primary roles: Sovereign (regional governors), Investor (impact investors), Scientist (researchers and data analysts), Community (community members and activists), and Admin (system administrators). Each role has specific permissions and dashboard views.",
    },
    {
      question: "How is data validated and secured?",
      answer: "Data integrity is maintained through multiple mechanisms: cryptographic verification, multi-signature approvals, and continuous monitoring. All data sources are authenticated, and changes are tracked in an immutable audit log. Row-level security ensures users only access data they're authorized to view.",
    },
    {
      question: "Can I export my data?",
      answer: "Yes, most data views support CSV export functionality. Navigate to the relevant dashboard or data table, and look for the 'Export CSV' button. For specialized reports, contact your administrator for custom export options.",
    },
    {
      question: "How do I get notified of RCI changes?",
      answer: "The system supports multiple notification channels including in-app notifications, email alerts, and webhook integrations. Configure your notification preferences in Settings > Notifications. Critical threshold breaches trigger immediate alerts to all relevant stakeholders.",
    },
  ];

  const tutorials = [
    {
      title: "Submitting Your First Verification Request",
      duration: "5 min",
      difficulty: "Beginner",
      description: "Learn how to create and submit a verification request for regenerative activities.",
    },
    {
      title: "Understanding RCI Dashboards",
      duration: "8 min",
      difficulty: "Beginner",
      description: "Navigate the RCI dashboard and interpret regenerative capacity metrics.",
    },
    {
      title: "Connecting External Data Sources",
      duration: "12 min",
      difficulty: "Intermediate",
      description: "Configure API and sensor data sources to feed real-time data into the system.",
    },
    {
      title: "Policy Simulation Workshop",
      duration: "15 min",
      difficulty: "Advanced",
      description: "Use the policy simulator to model the impact of different regenerative strategies.",
    },
  ];

  const filteredSections = docSections.filter(
    (section) =>
      section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.articles.some((article) =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container px-4 md:px-6">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-primary/10 mb-4">
              <Book className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl font-display font-bold text-foreground mb-4">
              Documentation
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Everything you need to understand and use the Atlas Sanctum Regenerative Operating System
            </p>

            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-lg"
              />
            </div>
          </motion.div>

          <Tabs defaultValue="guides" className="space-y-8">
            <TabsList className="glass-strong mx-auto w-fit">
              <TabsTrigger value="guides" className="gap-2">
                <FileText className="w-4 h-4" />
                Guides
              </TabsTrigger>
              <TabsTrigger value="tutorials" className="gap-2">
                <Play className="w-4 h-4" />
                Tutorials
              </TabsTrigger>
              <TabsTrigger value="faq" className="gap-2">
                <Lightbulb className="w-4 h-4" />
                FAQ
              </TabsTrigger>
              <TabsTrigger value="api" className="gap-2">
                <Code className="w-4 h-4" />
                API Reference
              </TabsTrigger>
            </TabsList>

            {/* Guides Tab */}
            <TabsContent value="guides">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSections.map((section, index) => (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="glass-strong border-border/50 h-full hover:border-primary/50 transition-colors cursor-pointer">
                      <CardHeader>
                        <div className="p-3 rounded-xl bg-primary/10 w-fit mb-2">
                          {section.icon}
                        </div>
                        <CardTitle>{section.title}</CardTitle>
                        <CardDescription>{section.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {section.articles.slice(0, 4).map((article, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                              <ArrowRight className="w-3 h-3 text-primary" />
                              {article.title}
                            </li>
                          ))}
                        </ul>
                        {section.articles.length > 4 && (
                          <p className="text-xs text-muted-foreground mt-3">
                            +{section.articles.length - 4} more articles
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Tutorials Tab */}
            <TabsContent value="tutorials">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tutorials.map((tutorial, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="glass-strong border-border/50 hover:border-primary/50 transition-colors cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-3 rounded-xl bg-primary/10">
                            <Play className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline">{tutorial.duration}</Badge>
                            <Badge
                              variant="outline"
                              className={
                                tutorial.difficulty === "Beginner"
                                  ? "border-green-500 text-green-500"
                                  : tutorial.difficulty === "Intermediate"
                                  ? "border-amber-500 text-amber-500"
                                  : "border-red-500 text-red-500"
                              }
                            >
                              {tutorial.difficulty}
                            </Badge>
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {tutorial.title}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {tutorial.description}
                        </p>
                        <Button variant="outline" className="mt-4 w-full">
                          Start Tutorial
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* FAQ Tab */}
            <TabsContent value="faq">
              <Card className="glass-strong border-border/50 max-w-3xl mx-auto">
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                  <CardDescription>
                    Quick answers to common questions about Atlas Sanctum
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                      <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            {/* API Reference Tab */}
            <TabsContent value="api">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="glass-strong border-border/50">
                  <CardHeader>
                    <div className="p-3 rounded-xl bg-primary/10 w-fit mb-2">
                      <Globe className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle>RCI Regions API</CardTitle>
                    <CardDescription>
                      Fetch and manage RCI regional data
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-500/20 text-green-500">GET</Badge>
                        <code>/api/regions</code>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-500/20 text-green-500">GET</Badge>
                        <code>/api/regions/:id</code>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-500/20 text-blue-500">POST</Badge>
                        <code>/api/regions</code>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-strong border-border/50">
                  <CardHeader>
                    <div className="p-3 rounded-xl bg-primary/10 w-fit mb-2">
                      <Coins className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle>Impact Tokens API</CardTitle>
                    <CardDescription>
                      Token minting and management
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-500/20 text-green-500">GET</Badge>
                        <code>/api/tokens</code>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-500/20 text-blue-500">POST</Badge>
                        <code>/api/tokens/mint</code>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-500/20 text-green-500">GET</Badge>
                        <code>/api/tokens/:id</code>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-strong border-border/50">
                  <CardHeader>
                    <div className="p-3 rounded-xl bg-primary/10 w-fit mb-2">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle>Verification API</CardTitle>
                    <CardDescription>
                      Verification workflow endpoints
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-500/20 text-green-500">GET</Badge>
                        <code>/api/verification</code>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-500/20 text-blue-500">POST</Badge>
                        <code>/api/verification</code>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-amber-500/20 text-amber-500">PUT</Badge>
                        <code>/api/verification/:id/sign</code>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="glass-strong border-border/50 mt-6">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        Full API Documentation
                      </h3>
                      <p className="text-muted-foreground">
                        Explore the complete API reference with examples and authentication guides
                      </p>
                    </div>
                    <Button>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Full Docs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Quick Reference Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-16"
          >
            <h2 className="text-2xl font-display font-bold text-foreground mb-6 text-center">
              Quick Reference
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="glass-strong border-border/50 p-4 text-center">
                <Leaf className="w-8 h-8 mx-auto mb-2 text-primary" />
                <h4 className="font-semibold">Land Capacity</h4>
                <p className="text-sm text-muted-foreground">Forest, soil, biodiversity</p>
              </Card>
              <Card className="glass-strong border-border/50 p-4 text-center">
                <Waves className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <h4 className="font-semibold">Ocean Capacity</h4>
                <p className="text-sm text-muted-foreground">Marine health, fisheries</p>
              </Card>
              <Card className="glass-strong border-border/50 p-4 text-center">
                <Heart className="w-8 h-8 mx-auto mb-2 text-rose-500" />
                <h4 className="font-semibold">Human Capacity</h4>
                <p className="text-sm text-muted-foreground">Health, wellbeing, equity</p>
              </Card>
              <Card className="glass-strong border-border/50 p-4 text-center">
                <Recycle className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                <h4 className="font-semibold">Circular Capacity</h4>
                <p className="text-sm text-muted-foreground">Recycling, reuse, efficiency</p>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
