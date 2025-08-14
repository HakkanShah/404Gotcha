
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { addVisit } from '@/lib/visits';
import { sendVisitNotification } from '@/lib/email';
import { filterBotTraffic } from '@/ai/flows/filter-bot-traffic';
import { parseUserAgent } from '@/lib/utils';
import type { Visit } from '@/lib/types';
import { getSettings } from '@/lib/settings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2 } from 'lucide-react';

async function getGeoData(ip: string): Promise<Partial<Visit>> {
  if (ip === '127.0.0.1' || ip === '::1') {
    return {
      city: 'Localhost',
      region: 'N/A',
      country: 'N/A',
      org: 'Local network',
    };
  }
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      next: { revalidate: 3600 * 24 }, // Cache for a day
    });
    if (!res.ok) throw new Error('Failed to fetch geo data');
    const data = await res.json();
    return {
      city: data.city,
      region: data.region,
      country: data.country_name,
      org: data.org,
    };
  } catch (error) {
    console.error('Geo data fetch error:', error);
    return { city: 'Unknown', region: 'Unknown', country: 'Unknown', org: 'Unknown' };
  }
}

export default async function Home() {
  const settings = await getSettings();

  // If no settings, redirect to setup page.
  if (!settings || !settings.redirectUrl || !settings.statsPassword) {
    redirect('/setup');
  }

  const headerList = headers();
  const ip = (headerList.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0].trim();
  const userAgent = headerList.get('user-agent') ?? '';
  const referrer = headerList.get('referer') ?? 'Direct';
  
  const geoData = await getGeoData(ip);
  const deviceData = parseUserAgent(userAgent);

  const botCheckResult = await filterBotTraffic({
    userAgent,
    ipAddress: ip,
    referrer,
  });

  const visit: Omit<Visit, 'id'> = {
    timestamp: new Date().toISOString(),
    ip,
    ...geoData,
    ...deviceData,
    userAgent,
    referrer,
    isBot: botCheckResult.isBot,
    botReason: botCheckResult.reason,
  };

  await addVisit(visit);

  if (!botCheckResult.isBot) {
    // We don't await this to avoid delaying the redirect
    sendVisitNotification({ ...visit, id: 'temp' }).catch(console.error);
  }

  // Instead of an instant redirect, show a page with a link.
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle>Visit Tracked!</CardTitle>
          <CardDescription>You are being redirected.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-primary" size={32}/>
          <p className="text-sm text-muted-foreground">
            If you are not redirected automatically, click the link below.
          </p>
          <Button asChild className="w-full">
            <a href={settings.redirectUrl} target="_blank" rel="noopener noreferrer">
              Go to {settings.redirectUrl}
              <ExternalLink className="ml-2" />
            </a>
          </Button>
        </CardContent>
      </Card>
      <meta http-equiv="refresh" content={`2;url=${settings.redirectUrl}`} />
    </main>
  );
}
