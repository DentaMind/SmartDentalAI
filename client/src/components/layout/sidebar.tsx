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
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="h-16 border-b border-gray-200 flex items-center px-6">
        <Stethoscope className="h-6 w-6 text-primary mr-2" />
        <span className="text-lg font-semibold">SmartDental AI</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <a
                className={`
                  flex items-center px-3 py-2 text-sm font-medium rounded-md
                  ${location === item.href
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-gray-50"}
                `}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-4">
        <LanguageSwitcher />
        <Button
          variant="ghost"
          className="w-full justify-start mt-4"
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );
}