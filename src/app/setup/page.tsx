
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
            Configuration Required
          </CardTitle>
          <CardDescription>
            Follow the steps below to finish setting up your application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <Alert>
            <AlertTitle>Your Tracking Link</AlertTitle>
            <AlertDescription>
              Once configured, any visit to{' '}
              <Link href="/" className="font-mono text-primary hover:underline">{appUrl}/</Link> 
              {' '}will be logged and redirected.
            </AlertDescription>
          </Alert>

          <Alert variant="default">
            <AlertTitle>Environment Variables Setup</AlertTitle>
            <AlertDescription>
                <p className="mb-4">You must set the following environment variables in your Vercel project settings:</p>
                
                <h3 className="font-semibold mt-4">Core Settings:</h3>
                <ul className="list-disc pl-5 mt-2 font-mono text-sm space-y-1">
                    <li><span className="font-bold">REDIRECT_URL</span>: The URL to redirect visitors to.</li>
                    <li><span className="font-bold">STATS_PASSWORD</span>: The password to protect your dashboard.</li>
                </ul>

                <h3 className="font-semibold mt-4">Email Notification Settings (Optional):</h3>
                 <ul className="list-disc pl-5 mt-2 font-mono text-sm space-y-1">
                    <li><span className="font-bold">GMAIL_EMAIL</span>: Your Gmail address for sending notifications.</li>
                    <li><span className="font-bold">GMAIL_APP_PASSWORD</span>: Your Gmail App Password.</li>
                    <li><span className="font-bold">NOTIFICATION_EMAIL</span>: The email address to receive notifications.</li>
                </ul>

                <h3 className="font-semibold mt-4">Vercel KV Storage Settings:</h3>
                <p className="mt-2 text-sm">First, create a Vercel KV database from your Vercel dashboard and link it to this project. Vercel will automatically add the required `KV_*` environment variables.</p>
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
