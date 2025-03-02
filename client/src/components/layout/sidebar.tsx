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
  Ruler, // Added for Orthodontic AI icon
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const { logoutMutation, user } = useAuth();

  // Define navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      { name: t("nav.home"), href: "/", icon: Home },
    ];

    const doctorItems = [
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
      { name: t("nav.orthodonticAI"), href: "/orthodontic-dashboard", icon: Ruler, highlight: true}, // Added Orthodontic AI
      { name: t("nav.dentalAISuite"), href: "/dental-ai-hub", icon: Bot, highlight: true} //Added Dental AI Suite
    ];

    const staffItems = [
      { 
        name: t("nav.aiDiagnostics"), 
        href: "/ai-diagnostics", 
        icon: Brain,
        highlight: true 
      },
      { name: t("nav.patients"), href: "/patients", icon: Users },
      { name: t("nav.appointments"), href: "/appointments", icon: Calendar },
      { name: t("nav.billing"), href: "/billing", icon: DollarSign },
      { name: t("nav.orthodonticAI"), href: "/orthodontic-dashboard", icon: Ruler, highlight: true}, // Added Orthodontic AI
      { name: t("nav.dentalAISuite"), href: "/dental-ai-hub", icon: Bot, highlight: true} //Added Dental AI Suite
    ];

    const patientItems = [
      { name: t("nav.appointments"), href: "/appointments", icon: Calendar },
      { name: t("nav.treatmentPlans"), href: "/treatment-plans", icon: FileText },
      { name: t("nav.xrays"), href: "/xrays", icon: Image },
      { name: t("nav.medicalHistory"), href: "/medical-history", icon: ClipboardList },
      { name: t("nav.billing"), href: "/billing", icon: DollarSign },
    ];

    const financialItems = [
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
          <a className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="p-2.5 rounded-xl bg-primary text-white shadow-lg rotate-12 hover:rotate-0 transition-transform duration-300">
              <Bot className="h-7 w-7" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent">
                DentaMind AI
              </span>
              <span className="text-xs text-gray-500 font-medium">
                AI-Powered Care
              </span>
            </div>
          </a>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-8 space-y-1.5">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <a
                className={`
                  flex items-center px-3 py-2.5 text-sm font-medium rounded-lg gap-3
                  transition-all duration-200 group
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
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 bg-white/50 p-4 space-y-4">
        <LanguageSwitcher />
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-600 hover:text-primary hover:bg-primary/10 gap-3"
          onClick={() => logoutMutation.mutate()}
        >
          <div className="p-1.5 rounded-md bg-primary/10">
            <LogOut className="h-5 w-5 text-primary" />
          </div>
          Logout
        </Button>
      </div>
    </div>
  );
}