import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "./language-switcher";
import { useAuth } from "@/hooks/use-auth";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  Ruler,
  Clock,
  Shield,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  Lightbulb,
  Mail,
  Package,
  Microscope,
  Beaker,
  BookOpen,
  GraduationCap,
  Award,
} from "lucide-react";
import { ToothDoctorIcon } from "../icons/tooth-doctor-icon";
import { CircuitToothIcon } from "../icons/circuit-tooth-icon";
import { LucideIcon } from "lucide-react";
import { useState, useEffect } from "react";

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
  const [collapsed, setCollapsed] = useState(false);
  
  // Store collapse state in localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebarCollapsed');
    if (savedCollapsed) {
      setCollapsed(savedCollapsed === 'true');
    }
  }, []);
  
  const toggleCollapse = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    localStorage.setItem('sidebarCollapsed', String(newCollapsed));
  };

  // Define navigation items based on user role
  const getNavigationItems = (): NavigationItem[] => {
    const baseItems: NavigationItem[] = [];

    const doctorItems: NavigationItem[] = [
      { name: "Schedule", href: "/appointments", icon: Calendar },
      { 
        name: "AI Hub", 
        href: "/ai-hub", 
        icon: CircuitToothIcon,
        highlight: true 
      },
      { name: "Patients", href: "/patients", icon: Users },
      { name: "Patient Directory", href: "/patient-list", icon: Users, highlight: true },
      { name: "Clinical Tools", href: "/dental-ai-hub", icon: Stethoscope },
      { name: "Email Hub", href: "/email", icon: Mail, highlight: true },
      { name: "Staff Management", href: "/time-clock", icon: Clock },
      { name: "Labs & Supplies", href: "/labs-supplies", icon: Beaker, highlight: true },
      { 
        name: "AI Recommendations", 
        href: "/ai-recommendations", 
        icon: Lightbulb,
        highlight: true 
      },
      { 
        name: "Training Center", 
        href: "/assistant-training", 
        icon: BookOpen 
      },
      { 
        name: "Training Dashboard", 
        href: "/training-dashboard", 
        icon: GraduationCap,
        highlight: true 
      }
    ];

    const staffItems: NavigationItem[] = [
      { name: "Schedule", href: "/appointments", icon: Calendar },
      { 
        name: "AI Hub", 
        href: "/ai-hub", 
        icon: CircuitToothIcon,
        highlight: true 
      },
      { name: "Patients", href: "/patients", icon: Users },
      { name: "Patient Directory", href: "/patient-list", icon: Users, highlight: true },
      { name: "Time Management", href: "/time-clock", icon: Clock },
      { name: "Clinical Tools", href: "/dental-ai-hub", icon: Stethoscope },
      { name: "Email Hub", href: "/email", icon: Mail, highlight: true },
      { name: "Labs & Supplies", href: "/labs-supplies", icon: Beaker, highlight: true },
      { 
        name: "AI Recommendations", 
        href: "/ai-recommendations", 
        icon: Lightbulb,
        highlight: true 
      },
      { 
        name: "Training Center", 
        href: "/assistant-training", 
        icon: BookOpen,
        highlight: true
      }
    ];

    const patientItems: NavigationItem[] = [
      { name: "My Appointments", href: "/appointments", icon: Calendar },
      { name: "Request Appointment", href: "/appointment-request", icon: Calendar, highlight: true },
      { name: "Treatment Plans", href: "/treatment-plans", icon: FileText },
      { name: "Post-Op Instructions", href: "/post-op-instructions", icon: ClipboardList },
      { name: "My Records", href: "/xrays", icon: Image },
      { name: "Medical History", href: "/medical-history", icon: FileText },
    ];

    const financialItems: NavigationItem[] = [
      { name: "Financial Dashboard", href: "/financial-dashboard", icon: DollarSign },
    ];

    const adminItems: NavigationItem[] = [
      { name: "Schedule", href: "/appointments", icon: Calendar },
      { name: "Patients", href: "/patients", icon: Users },
      { name: "Patient Directory", href: "/patient-list", icon: Users, highlight: true },
      { name: "AI Hub", href: "/ai-hub", icon: CircuitToothIcon, highlight: true },
      { name: "Staff Management", href: "/time-clock", icon: Clock },
      { name: "Email Hub", href: "/email", icon: Mail, highlight: true },
      { name: "Labs & Supplies", href: "/labs-supplies", icon: Beaker, highlight: true },
      { name: "Financial Dashboard", href: "/financial-dashboard", icon: DollarSign },
      { name: "Training Dashboard", href: "/training-dashboard", icon: GraduationCap, highlight: true }
    ];

    switch (user?.role) {
      case "doctor":
        return [...baseItems, ...doctorItems, ...financialItems];
      case "staff":
        return [...baseItems, ...staffItems, ...financialItems];
      case "patient":
        return [...baseItems, ...patientItems]; // No financial items for patients
      case "admin":
        return [...baseItems, ...adminItems];
      default:
        return [...doctorItems, ...financialItems]; // Show doctor items by default
    }
  };

  const navigation = getNavigationItems();

  return (
    <div className={`flex flex-col h-full bg-white border-r border-gray-200 relative transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-60'}`}>
      {/* Toggle button */}
      <Button 
        variant="ghost" 
        size="sm" 
        className="absolute -right-3 top-20 p-1 h-6 w-6 rounded-full bg-white border border-gray-200 shadow-sm"
        onClick={toggleCollapse}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
      </Button>
      
      <div className="flex items-center justify-center h-20 px-2">
        <div 
          onClick={() => window.location.href = "/"}
          className="flex items-center gap-3 hover:opacity-90 transition-opacity cursor-pointer"
        >
          <div className="flex justify-center items-center h-14 w-14">
            <img 
              src="/src/assets/dentamind-logo-tooth-hq.png" 
              alt="DentaMind Logo" 
              className="h-14 w-14 animate-pulse-subtle hover:scale-110 transition-transform duration-300" 
            />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent">
                DentaMind
              </span>
              <span className="text-xs text-gray-500 font-medium">
                AI-Powered Dental Excellence
              </span>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        <TooltipProvider>
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Tooltip key={item.href} delayDuration={collapsed ? 100 : 1000}>
                <TooltipTrigger asChild>
                  <div
                    onClick={() => window.location.href = item.href}
                    className={`
                      flex items-center ${collapsed ? 'justify-center' : 'px-3'} py-2 text-sm font-medium rounded-lg 
                      ${collapsed ? 'gap-0' : 'gap-3'}
                      transition-all duration-200 group cursor-pointer
                      ${item.highlight && !collapsed ? 'bg-gradient-to-r from-primary/10 to-primary/5' : ''}
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
                    {!collapsed && (
                      <>
                        {item.name}
                        {item.highlight && (
                          <span className="ml-auto px-2 py-0.5 text-xs font-semibold bg-primary/20 text-primary rounded-full">
                            New
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right">
                    <p>{item.name}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </nav>

      <div className={`border-t border-gray-200 bg-white/50 ${collapsed ? 'p-2' : 'p-4'} space-y-2`}>
        {!collapsed && <LanguageSwitcher />}
        
        <TooltipProvider>
          <Tooltip delayDuration={collapsed ? 100 : 1000}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={`${collapsed ? 'w-full justify-center px-0' : 'w-full justify-start'} text-gray-600 hover:text-primary hover:bg-primary/10 ${collapsed ? '' : 'gap-3'}`}
                onClick={() => logout()}
              >
                <div className="p-1.5 rounded-md bg-primary/10">
                  <LogOut className="h-5 w-5 text-primary" />
                </div>
                {!collapsed && "Logout"}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">
                <p>Logout</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        
        <div className="space-y-1">
          {!collapsed && (
            <h4 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              System
            </h4>
          )}
          <nav className="space-y-1">
            <TooltipProvider>
              <Tooltip delayDuration={collapsed ? 100 : 1000}>
                <TooltipTrigger asChild>
                  <div 
                    onClick={() => window.location.href = "/security"}
                    className={`flex items-center ${collapsed ? 'justify-center px-0' : 'px-4'} py-2 text-gray-700 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors cursor-pointer`}
                  >
                    <Shield className={`w-5 h-5 ${collapsed ? '' : 'mr-3'}`} />
                    {!collapsed && "Security"}
                  </div>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right">
                    <p>Security</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </nav>
        </div>
      </div>
    </div>
  );
}