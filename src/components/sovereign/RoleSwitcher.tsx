import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Crown,
  TrendingUp,
  FlaskConical,
  Users,
  Shield,
  ChevronDown,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

type AppRole = "sovereign" | "investor" | "scientist" | "community" | "admin";

interface RoleSwitcherProps {
  roles: string[];
  currentRole?: AppRole;
  onRoleChange?: (role: AppRole) => void;
}

const roleConfig: Record<AppRole, { 
  label: string; 
  icon: React.ElementType; 
  color: string;
  route: string;
  description: string;
}> = {
  sovereign: {
    label: "Sovereign",
    icon: Crown,
    color: "text-amber-500",
    route: "/sovereign",
    description: "National RCI Dashboard & Bond Issuance",
  },
  investor: {
    label: "Investor",
    icon: TrendingUp,
    color: "text-emerald-500",
    route: "/investor",
    description: "Portfolio & Impact Token Analytics",
  },
  scientist: {
    label: "Scientist",
    icon: FlaskConical,
    color: "text-sky-500",
    route: "/scientist",
    description: "Research Data & Methodology",
  },
  community: {
    label: "Community",
    icon: Users,
    color: "text-violet-500",
    route: "/community",
    description: "Local Impact & Challenges",
  },
  admin: {
    label: "Admin",
    icon: Shield,
    color: "text-red-500",
    route: "/admin",
    description: "System Administration",
  },
};

export const RoleSwitcher = ({ roles, currentRole, onRoleChange }: RoleSwitcherProps) => {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState<AppRole>(currentRole || (roles[0] as AppRole) || "community");

  const availableRoles = roles.filter((r) => r in roleConfig) as AppRole[];
  const config = roleConfig[activeRole];
  const Icon = config?.icon || Users;

  const handleRoleSelect = (role: AppRole) => {
    setActiveRole(role);
    onRoleChange?.(role);
    navigate(roleConfig[role].route);
  };

  if (availableRoles.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 border-border/50 bg-card/50 hover:bg-card"
        >
          <div className={`p-1 rounded ${config?.color}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="hidden sm:inline font-medium">{config?.label}</span>
          <Badge variant="secondary" className="hidden md:flex text-xs">
            {availableRoles.length} roles
          </Badge>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Switch Dashboard Role
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableRoles.map((role) => {
          const roleInfo = roleConfig[role];
          const RoleIcon = roleInfo.icon;
          const isActive = role === activeRole;

          return (
            <DropdownMenuItem
              key={role}
              onClick={() => handleRoleSelect(role)}
              className="flex items-start gap-3 p-3 cursor-pointer"
            >
              <div className={`p-2 rounded-lg bg-secondary ${roleInfo.color}`}>
                <RoleIcon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{roleInfo.label}</span>
                  {isActive && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {roleInfo.description}
                </p>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default RoleSwitcher;
