import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "./navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";
import { Button } from "./button";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Bell, Brain, Calendar, ChevronDown, Cog, FileText, Home, Menu, Search, Tooth, Users, X, Activity, PanelLeft, BarChart3, Stethoscope, HeartPulse, LucideIcon, ClipboardList, BookOpen, DollarSign } from "lucide-react";
import { Badge } from "./badge";
import { Input } from "./input";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "react-router-dom";
import { NotificationCenter } from "../notifications/NotificationCenter";

interface NavbarProps {
  onSidebarToggle?: () => void;
  isSidebarOpen?: boolean;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  submenu?: {
    title: string;
    description?: string;
    href: string;
    badge?: string;
  }[];
}

export function Navbar({ onSidebarToggle, isSidebarOpen }: NavbarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mainNavItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/",
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: "Patients",
      href: "/patients",
      icon: <Users className="h-5 w-5" />,
      submenu: [
        {
          title: "Patient List",
          description: "View and manage all patients",
          href: "/patients",
        },
        {
          title: "New Patient",
          description: "Register a new patient",
          href: "/patients/new",
        },
        {
          title: "Patient Search",
          description: "Search for specific patients",
          href: "/patients/search",
        },
        {
          title: "Recent Encounters",
          description: "View recent patient interactions",
          href: "/patients/recent",
          badge: "New",
        },
      ],
    },
    {
      title: "Scheduler",
      href: "/scheduler",
      icon: <Calendar className="h-5 w-5" />,
      submenu: [
        {
          title: "Daily View",
          description: "See today's appointments",
          href: "/scheduler/day",
        },
        {
          title: "Weekly View",
          description: "View appointments by week",
          href: "/scheduler/week",
        },
        {
          title: "Calendar View",
          description: "Monthly calendar overview",
          href: "/scheduler/month",
        },
        {
          title: "Waiting List",
          description: "Manage patient waiting list",
          href: "/scheduler/waiting-list",
        },
      ],
    },
    {
      title: "Dental Charts",
      href: "/charts",
      icon: <Tooth className="h-5 w-5" />,
      submenu: [
        {
          title: "Restorative Chart",
          description: "View and edit restorative chart",
          href: "/charts/restorative",
        },
        {
          title: "Perio Chart",
          description: "Periodontal charting",
          href: "/charts/perio",
        },
        {
          title: "3D Visualization",
          description: "Interactive 3D tooth models",
          href: "/charts/3d",
          badge: "AI",
        },
      ],
    },
    {
      title: "AI Diagnostics",
      href: "/ai-diagnostics",
      icon: <Brain className="h-5 w-5" />,
      submenu: [
        {
          title: "X-ray Analysis",
          description: "AI-powered radiograph analysis",
          href: "/ai-diagnostics/xray",
        },
        {
          title: "Treatment Suggestions",
          description: "AI treatment recommendations",
          href: "/ai-diagnostics/treatment",
        },
        {
          title: "AI Feedback",
          description: "Provide feedback on AI performance",
          href: "/ai-diagnostics/feedback",
        },
        {
          title: "Model Performance",
          description: "View AI model metrics",
          href: "/ai-diagnostics/metrics",
        },
      ],
    },
    {
      title: "Treatment Plans",
      href: "/treatment-plans",
      icon: <ClipboardList className="h-5 w-5" />,
    },
    {
      title: "Billing",
      href: "/billing",
      icon: <DollarSign className="h-5 w-5" />,
      submenu: [
        {
          title: "Insurance Claims",
          description: "Manage insurance claims",
          href: "/billing/claims",
        },
        {
          title: "Patient Payments",
          description: "Track and process payments",
          href: "/billing/payments",
        },
        {
          title: "Financial Arrangements",
          description: "Setup payment plans",
          href: "/billing/arrangements",
        },
      ],
    },
    {
      title: "Reports",
      href: "/reports",
      icon: <BarChart3 className="h-5 w-5" />,
    },
  ];

  const secondaryNavItems: NavItem[] = [
    {
      title: "AI Training",
      href: "/ai-training",
      icon: <Activity className="h-5 w-5" />,
    },
    {
      title: "Knowledge Base",
      href: "/knowledge",
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      title: "Medical",
      href: "/medical",
      icon: <HeartPulse className="h-5 w-5" />,
    },
    {
      title: "E-Prescriptions",
      href: "/prescriptions",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: <Cog className="h-5 w-5" />,
    },
  ];

  return (
    <div className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="flex h-16 items-center px-4 md:px-6">
        {/* Mobile Menu Toggle */}
        <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={() => onSidebarToggle?.()}>
          {isSidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle Menu</span>
        </Button>

        {/* Logo */}
        <div className="flex items-center mr-4">
          <Tooth className="h-6 w-6 text-primary mr-2" />
          <span className="hidden font-bold text-lg md:inline-block">DentaMind</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex">
          <NavigationMenu>
            <NavigationMenuList>
              {mainNavItems.map((item) => (
                <NavigationMenuItem key={item.title}>
                  {item.submenu ? (
                    <>
                      <NavigationMenuTrigger className={cn(
                        "flex items-center gap-1",
                        location.pathname === item.href || location.pathname.startsWith(`${item.href}/`) 
                          ? "text-primary"
                          : ""
                      )}>
                        {item.icon}
                        <span className="ml-1">{item.title}</span>
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                          {item.submenu.map((subItem) => (
                            <li key={subItem.title}>
                              <NavigationMenuLink asChild>
                                <Link
                                  to={subItem.href}
                                  className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="text-sm font-medium leading-none">{subItem.title}</div>
                                    {subItem.badge && (
                                      <Badge variant="secondary" className="ml-2 text-xs">
                                        {subItem.badge}
                                      </Badge>
                                    )}
                                  </div>
                                  {subItem.description && (
                                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                      {subItem.description}
                                    </p>
                                  )}
                                </Link>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </>
                  ) : (
                    <Link
                      to={item.href}
                      className={cn(
                        navigationMenuTriggerStyle(),
                        "flex items-center gap-1",
                        location.pathname === item.href
                          ? "text-primary"
                          : ""
                      )}
                    >
                      {item.icon}
                      <span className="ml-1">{item.title}</span>
                    </Link>
                  )}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Mobile Menu (Sheet) */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="mr-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[350px]">
            <SheetHeader className="pb-4">
              <SheetTitle className="flex items-center">
                <Tooth className="h-6 w-6 text-primary mr-2" />
                <span>DentaMind</span>
              </SheetTitle>
              <SheetDescription>Dental practice management & AI diagnostics</SheetDescription>
            </SheetHeader>
            <nav className="flex flex-col gap-2 py-4">
              {[...mainNavItems, ...secondaryNavItems].map((item) => (
                <Link
                  key={item.title}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                    location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon}
                  {item.title}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Search Bar */}
        <div className="hidden md:flex w-full max-w-sm items-center space-x-2 mr-4">
          <Input
            type="search"
            placeholder="Search patients, appointments..."
            className="rounded-full h-9"
          />
          <Button type="submit" size="icon" variant="ghost">
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <NotificationCenter />
          
          {/* User Avatar */}
          <Avatar>
            <AvatarImage src={user?.avatarUrl} alt={user?.name || "User"} />
            <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
} 