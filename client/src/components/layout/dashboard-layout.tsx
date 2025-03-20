import React, { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, BellRing, Settings, User, Calendar, Activity, FileText, DollarSign, BarChart, Mail, Menu, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
}

interface SidebarItemProps {
  icon: ReactNode;
  label: string;
  href: string;
  count?: number;
  active?: boolean;
}

const navigationItems = [
  { icon: <Activity className="h-4 w-4 mr-2" />, label: 'Dashboard', href: '/dashboard' },
  { icon: <Calendar className="h-4 w-4 mr-2" />, label: 'Appointments', href: '/appointments' },
  { icon: <User className="h-4 w-4 mr-2" />, label: 'Patients', href: '/patients' },
  { icon: <FileText className="h-4 w-4 mr-2" />, label: 'Medical Records', href: '/medical-records' },
  { icon: <DollarSign className="h-4 w-4 mr-2" />, label: 'Billing', href: '/billing' },
  { icon: <BarChart className="h-4 w-4 mr-2" />, label: 'Analytics', href: '/analytics' },
  { icon: <Mail className="h-4 w-4 mr-2" />, label: 'Email AI', href: '/email-ai' },
  { icon: <Settings className="h-4 w-4 mr-2" />, label: 'Settings', href: '/settings' },
];

const SidebarItem = ({ icon, label, href, count, active }: SidebarItemProps) => {
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center py-2 px-3 rounded-md text-sm font-medium transition-colors",
          active 
            ? "bg-primary text-primary-foreground" 
            : "hover:bg-muted text-muted-foreground hover:text-foreground"
        )}
      >
        {icon}
        <span>{label}</span>
        {count !== undefined && (
          <span className="ml-auto bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs">
            {count}
          </span>
        )}
      </a>
    </Link>
  );
};

export const DashboardLayout = ({ 
  children, 
  title = "Dashboard",
  description,
  actions
}: DashboardLayoutProps) => {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex dark:bg-gray-950">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 z-10 border-r">
        <div className="flex flex-col h-full py-4">
          <div className="px-4 mb-6">
            <div className="flex items-center h-12">
              <img src="/logo-64.png" alt="DentaMind" className="h-8 w-8" />
              <h1 className="ml-2 text-xl font-bold tracking-tight">DentaMind</h1>
            </div>
          </div>
          
          <ScrollArea className="flex-1 px-3">
            <nav className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarItem
                  key={item.href}
                  icon={item.icon}
                  label={item.label}
                  href={item.href}
                  active={location === item.href}
                />
              ))}
            </nav>
          </ScrollArea>
          
          <div className="px-3 mt-6">
            <div className="border-t pt-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" />
                    <AvatarFallback>DR</AvatarFallback>
                  </Avatar>
                  <div className="ml-2">
                    <p className="text-sm font-medium">Dr. Smith</p>
                    <p className="text-xs text-muted-foreground">Dentist</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 border-b bg-background z-10 flex items-center px-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <div className="flex flex-col h-full py-4">
              <div className="px-4 mb-6 flex justify-between items-center">
                <div className="flex items-center h-12">
                  <img src="/logo-64.png" alt="DentaMind" className="h-8 w-8" />
                  <h1 className="ml-2 text-xl font-bold tracking-tight">DentaMind</h1>
                </div>
              </div>
              
              <ScrollArea className="flex-1 px-3">
                <nav className="space-y-1">
                  {navigationItems.map((item) => (
                    <SidebarItem
                      key={item.href}
                      icon={item.icon}
                      label={item.label}
                      href={item.href}
                      active={location === item.href}
                    />
                  ))}
                </nav>
              </ScrollArea>
              
              <div className="px-3 mt-6">
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" />
                        <AvatarFallback>DR</AvatarFallback>
                      </Avatar>
                      <div className="ml-2">
                        <p className="text-sm font-medium">Dr. Smith</p>
                        <p className="text-xs text-muted-foreground">Dentist</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        
        <div className="flex items-center">
          <h1 className="text-lg font-bold">{title}</h1>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <BellRing className="h-5 w-5" />
          </Button>
          <Avatar className="h-8 w-8">
            <AvatarImage src="" />
            <AvatarFallback>DR</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:pl-64">
        <main className="py-6 px-4 lg:py-8 lg:px-6 min-h-screen">
          {/* Desktop Header */}
          <div className="mb-6 hidden lg:flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              {description && <p className="text-muted-foreground mt-1">{description}</p>}
            </div>
            <div className="flex items-center gap-4">
              {actions}
              <Button variant="ghost" size="icon">
                <BellRing className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Mobile page title shown below header */}
          <div className="pt-16 pb-4 lg:hidden">
            <h1 className="text-xl font-bold">{title}</h1>
            {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
            {actions && <div className="mt-4">{actions}</div>}
          </div>

          {/* Content */}
          <div className="mt-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};