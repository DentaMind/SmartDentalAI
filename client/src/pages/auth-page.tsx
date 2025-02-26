import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Redirect } from "wouter";
import { Stethoscope } from "lucide-react";

export default function AuthPage() {
  const { t } = useTranslation();
  const { user, loginMutation, registerMutation } = useAuth();

  const loginForm = useForm({
    resolver: zodResolver(insertUserSchema.pick({ username: true, password: true })),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      role: "doctor",
      language: "en",
    },
  });

  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8">
        <div className="flex flex-col justify-center space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary text-white shadow-lg rotate-12 hover:rotate-0 transition-transform duration-300">
              <Stethoscope className="h-8 w-8" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-4xl font-bold tracking-tight text-primary">
                Smart Dental AI
              </h1>
              <span className="text-sm text-gray-500 font-medium">
                AI-Powered Care
              </span>
            </div>
          </div>
          <p className="text-xl text-gray-600">
            Experience next-generation dental care with AI assistance and advanced patient management.
          </p>
          <div className="mt-8">
            <img 
              src="/attached_assets/iStock-526222203.jpg" 
              alt="Professional dental smile" 
              className="rounded-2xl shadow-xl w-full h-[300px] object-cover"
            />
          </div>
        </div>

        <Card className="w-full self-center bg-white shadow-lg">
          <CardContent className="pt-6">
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  {t("auth.login")}
                </TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  {t("auth.register")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">{t("auth.username")}</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-gray-50 border-gray-200" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">{t("auth.password")}</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} className="bg-gray-50 border-gray-200" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary/90 text-white shadow-md" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Loading..." : t("auth.login")}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">{t("auth.username")}</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-gray-50 border-gray-200" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">{t("auth.password")}</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} className="bg-gray-50 border-gray-200" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <input type="hidden" {...registerForm.register("role")} />
                    <input type="hidden" {...registerForm.register("language")} />
                    <Button 
                      type="submit" 
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white shadow-md" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Loading..." : t("auth.register")}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}