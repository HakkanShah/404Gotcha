
'use client';

import { useEffect, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Settings, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default function SetupPage() {
  const [loading, setLoading] = useState(true);
  const [appUrl, setAppUrl] = useState('');

  useEffect(() => {
    setAppUrl(window.location.origin);
    setLoading(false);
  }, []);


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
            All application settings are now managed via environment variables on your hosting provider.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <Alert className="mb-6">
            <AlertTitle>Your Tracking Link</AlertTitle>
            <AlertDescription>
              Any visit to{' '}
              <Link href="/" className="font-mono text-primary hover:underline">{appUrl}/</Link> 
              {' '}will be logged and redirected to the URL you configured in your environment variables.
            </AlertDescription>
          </Alert>

          <Alert variant="default">
            <AlertTitle>How to Change Settings</AlertTitle>
            <AlertDescription>
              To change your Redirect URL, password, or email notification settings, please update the environment variables on Vercel and redeploy your application. You will need to set the following variables:
              <ul className="list-disc pl-5 mt-2 font-mono text-sm">
                <li>REDIRECT_URL</li>
                <li>STATS_PASSWORD</li>
                <li>GMAIL_EMAIL</li>
                <li>GMAIL_APP_PASSWORD</li>
                <li>NOTIFICATION_EMAIL</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-start gap-4">
            <Button variant="default" asChild>
              <Link href="/stats">Go to Stats</Link>
            </Button>
            <Button variant="outline" asChild>
              <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">
                Go to Vercel <ExternalLink className="ml-2" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
