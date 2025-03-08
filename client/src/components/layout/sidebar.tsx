import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "./language-switcher";
import { useAuth } from "@/hooks/use-auth";
import {
  Users,
  Calendar,
  FileText,
  LogOut,
  Home,
  Stethoscope,
  Image,
  ClipboardList,
  DollarSign,
  Brain,
  ActivitySquare,
  Bot,
  Ruler,
  Clock,
  Shield,
  LayoutDashboard,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

// Define the navigation item interface with optional highlight property
interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  highlight?: boolean;
}

export function Sidebar() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const { logout, user } = useAuth();

  // Define navigation items based on user role
  const getNavigationItems = (): NavigationItem[] => {
    const baseItems: NavigationItem[] = [
      { name: t("nav.home"), href: "/", icon: Home },
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, highlight: true },
    ];

    const doctorItems: NavigationItem[] = [
      { 
        name: t("nav.aiDiagnostics"), 
        href: "/ai-diagnostics", 
        icon: Brain,
        highlight: true 
      },
      { name: t("nav.patients"), href: "/patients", icon: Users },
      { name: t("nav.appointments"), href: "/appointments", icon: Calendar },
      { name: t("nav.treatmentPlans"), href: "/treatment-plans", icon: FileText },
      { name: t("nav.xrays"), href: "/xrays", icon: Image },
      { name: t("nav.billing"), href: "/billing", icon: DollarSign },
      { name: t("nav.timeClock"), href: "/time-clock", icon: Clock },
      { name: t("nav.orthodonticAI"), href: "/orthodontic-dashboard", icon: Ruler, highlight: true }, // Added Orthodontic AI
      { name: t("nav.dentalAISuite"), href: "/dental-ai-hub", icon: Bot, highlight: true } //Added Dental AI Suite
    ];

    const staffItems: NavigationItem[] = [
      { 
        name: t("nav.aiDiagnostics"), 
        href: "/ai-diagnostics", 
        icon: Brain,
        highlight: true 
      },
      { name: t("nav.patients"), href: "/patients", icon: Users },
      { name: t("nav.appointments"), href: "/appointments", icon: Calendar },
      { name: t("nav.billing"), href: "/billing", icon: DollarSign },
      { name: t("nav.timeClock"), href: "/time-clock", icon: Clock },
      { name: t("nav.orthodonticAI"), href: "/orthodontic-dashboard", icon: Ruler, highlight: true }, // Added Orthodontic AI
      { name: t("nav.dentalAISuite"), href: "/dental-ai-hub", icon: Bot, highlight: true } //Added Dental AI Suite
    ];

    const patientItems: NavigationItem[] = [
      { name: t("nav.appointments"), href: "/appointments", icon: Calendar },
      { name: t("nav.treatmentPlans"), href: "/treatment-plans", icon: FileText },
      { name: t("nav.xrays"), href: "/xrays", icon: Image },
      { name: t("nav.medicalHistory"), href: "/medical-history", icon: ClipboardList },
      { name: t("nav.billing"), href: "/billing", icon: DollarSign },
    ];

    const financialItems: NavigationItem[] = [
      { name: t("nav.financial"), href: "/financial", icon: DollarSign },
    ];

    switch (user?.role) {
      case "doctor":
        return [...baseItems, ...doctorItems, ...financialItems];
      case "staff":
        return [...baseItems, ...staffItems, ...financialItems];
      case "patient":
        return [...baseItems, ...patientItems, ...financialItems];
      default:
        return [...baseItems, ...financialItems];
    }
  };

  const navigation = getNavigationItems();

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="flex items-center justify-center h-20 px-6">
        <Link href="/">
          <div className="flex items-center gap-3 hover:opacity-90 transition-opacity cursor-pointer">
            <div className="p-2.5 rounded-xl bg-primary text-white shadow-lg rotate-12 hover:rotate-0 transition-transform duration-300">
              <Bot className="h-7 w-7" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent">
                SmartDental AI
              </span>
              <span className="text-xs text-gray-500 font-medium">
                AI-Powered Care
              </span>
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-8 space-y-1.5">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`
                  flex items-center px-3 py-2.5 text-sm font-medium rounded-lg gap-3
                  transition-all duration-200 group cursor-pointer
                  ${item.highlight ? 'bg-gradient-to-r from-primary/10 to-primary/5' : ''}
                  ${isActive
                    ? "bg-primary text-white shadow-md"
                    : "text-gray-600 hover:bg-primary/10 hover:text-primary hover:shadow-sm"}
                `}
              >
                <div className={`
                  p-1.5 rounded-md transition-colors duration-200
                  ${isActive 
                    ? "bg-white/20" 
                    : "bg-primary/10 group-hover:bg-primary/20"}
                `}>
                  <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-primary"}`} />
                </div>
                {item.name}
                {item.highlight && (
                  <span className="ml-auto px-2 py-0.5 text-xs font-semibold bg-primary/20 text-primary rounded-full">
                    New
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 bg-white/50 p-4 space-y-4">
        <LanguageSwitcher />
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-600 hover:text-primary hover:bg-primary/10 gap-3"
          onClick={() => logout()}
        >
          <div className="p-1.5 rounded-md bg-primary/10">
            <LogOut className="h-5 w-5 text-primary" />
          </div>
          Logout
        </Button>
        <div className="space-y-1">
          <h4 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            System
          </h4>
          <nav className="space-y-1">
            <Link href="/security">
              <div className="flex items-center px-4 py-2 text-gray-700 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors cursor-pointer">
                <Shield className="w-5 h-5 mr-3" />
                Security
              </div>
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}