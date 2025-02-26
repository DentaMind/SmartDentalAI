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
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const { logoutMutation } = useAuth();

  const navigation = [
    { name: t("nav.home"), href: "/", icon: Home },
    { name: t("nav.patients"), href: "/patients", icon: Users },
    { name: t("nav.appointments"), href: "/appointments", icon: Calendar },
    { name: t("nav.treatmentPlans"), href: "/treatment-plans", icon: FileText },
  ];

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-white to-blue-50/30 border-r border-gray-200">
      <div className="flex items-center justify-center h-16 px-6 bg-white border-b border-gray-200">
        <Link href="/">
          <a className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="p-2 rounded-lg bg-primary/5">
              <Stethoscope className="h-6 w-6 text-primary" />
            </div>
            <span className="text-lg font-semibold tracking-tight">SmartDental</span>
          </a>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <a
                className={`
                  flex items-center px-3 py-2.5 text-sm font-medium rounded-lg gap-3
                  transition-colors duration-200
                  ${isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-gray-700 hover:bg-primary/10 hover:text-primary"}
                `}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-primary"}`} />
                {item.name}
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 bg-white p-4 space-y-4">
        <LanguageSwitcher />
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-700 hover:text-primary hover:bg-primary/10"
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );
}