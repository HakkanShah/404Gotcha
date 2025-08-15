
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Settings } from "lucide-react";
import { getSettings, saveSettings } from "@/lib/settings";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const formSchema = z.object({
  redirectUrl: z.string().url({ message: "Please enter a valid URL." }),
});

type SettingsData = z.infer<typeof formSchema>;

export default function SetupPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appUrl, setAppUrl] = useState('');

  const form = useForm<SettingsData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      redirectUrl: "",
    },
  });

  useEffect(() => {
    setAppUrl(window.location.origin);
    
    async function fetchSettings() {
      setLoading(true);
      const settings = await getSettings();
      if (settings?.redirectUrl) {
        form.reset({ redirectUrl: settings.redirectUrl });
      }
      setLoading(false);
    }
    fetchSettings();
  }, [form]);

  async function onSubmit(values: SettingsData) {
    setSaving(true);
    try {
      await saveSettings(values);
      toast({
        title: "Settings Saved",
        description: "Your new settings have been applied.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-8">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Settings className="text-primary" />
            Configuration
          </CardTitle>
          <CardDescription>
            Configure your 404Gotcha tracker. Once saved, you can start using your tracking link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertTitle>Your Tracking Link</AlertTitle>
            <AlertDescription>
              Once you save your settings, any visit to{' '}
              <Link href="/" className="font-mono text-primary hover:underline">{appUrl}/</Link> 
              {' '}will be logged and redirected.
            </AlertDescription>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="redirectUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Redirect URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://your-main-site.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is where visitors will be sent after their visit is logged.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Alert variant="default">
                <AlertTitle>Other Settings</AlertTitle>
                <AlertDescription>
                  Your password and email notification settings are managed via environment variables on your hosting provider (e.g., Netlify).
                </AlertDescription>
              </Alert>

              <div className="flex items-center justify-between">
                <Button variant="outline" asChild>
                  <Link href="/stats">Back to Stats</Link>
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 animate-spin" />}
                  Save Settings
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
