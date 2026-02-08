import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  Coins,
  TrendingUp,
  Leaf,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface PortfolioSummaryProps {
  totalValue: number;
  totalTokens: number;
  impactScore: number;
  changePercent?: number;
}

export const PortfolioSummary = ({
  totalValue,
  totalTokens,
  impactScore,
  changePercent = 12.5,
}: PortfolioSummaryProps) => {
  const isPositive = changePercent >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="glass-strong border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Portfolio Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-display font-bold text-primary">
            ${totalValue.toLocaleString()}
          </p>
          <p className={`text-xs flex items-center gap-1 mt-1 ${isPositive ? 'text-primary' : 'text-destructive'}`}>
            {isPositive ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {isPositive ? '+' : ''}{changePercent.toFixed(1)}% this month
          </p>
        </CardContent>
      </Card>

      <Card className="glass-strong border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
            <Coins className="w-4 h-4" />
            Total Tokens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-display font-bold text-foreground">
            {totalTokens.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Across all token types
          </p>
        </CardContent>
      </Card>

      <Card className="glass-strong border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Avg Token Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-display font-bold text-foreground">
            ${totalTokens > 0 ? (totalValue / totalTokens).toFixed(2) : "0.00"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Weighted average
          </p>
        </CardContent>
      </Card>

      <Card className="glass-strong border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
            <Leaf className="w-4 h-4" />
            Impact Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-display font-bold text-primary">
            {impactScore}
          </p>
          <Progress value={impactScore} className="mt-2 h-2" />
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioSummary;
