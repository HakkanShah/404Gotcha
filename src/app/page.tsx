
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { addVisit } from '@/lib/visits';
import { sendVisitNotification } from '@/lib/email';
import { filterBotTraffic, FilterBotTrafficOutput } from '@/ai/flows/filter-bot-traffic';
import { parseUserAgent } from '@/lib/utils';
import type { Visit } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ExternalLink, Rocket } from 'lucide-react';
import { settings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

async function getGeoData(ip: string): Promise<Partial<Visit>> {
  // Don't fetch geo data for local or private IPs
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return {
      city: 'Local',
      region: 'N/A',
      country: 'N/A',
      org: 'Local Network',
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
  const headerList = headers();

  // If critical settings are missing, redirect to setup page.
  if (!settings.redirectUrl || !settings.isKvConfigured) {
    redirect('/setup');
  }

  const ip = (headerList.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0].trim();
  const userAgent = headerList.get('user-agent') ?? '';
  const referrer = headerList.get('referer') ?? 'Direct';
  
  const geoData = await getGeoData(ip);
  const deviceData = parseUserAgent(userAgent);
  
  let botCheckResult: FilterBotTrafficOutput = { isBot: false, reason: "AI check skipped" };

  try {
    botCheckResult = await filterBotTraffic({
      userAgent,
      ipAddress: ip,
      referrer,
    });
  } catch(e) {
    console.error("Error running bot filter traffic", e)
    // Default to isBot: true if AI check fails to be safe
    botCheckResult = { isBot: true, reason: "AI check failed" };
  }

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

  // Wait for the visit to be added before doing anything else
  await addVisit(visit).catch(console.error);

  if (!botCheckResult.isBot && settings.isEmailConfigured) {
    sendVisitNotification({ ...visit, id: 'temp' }).catch(console.error);
  }

  // In a production Vercel environment, always redirect.
  if (process.env.VERCEL_ENV === 'production') {
    redirect(settings.redirectUrl!);
  }

  // Fallback for local dev, iFrame view or Vercel preview
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="text-center space-y-4">
        <div className="relative w-24 h-24 mx-auto">
          <Rocket className="w-full h-full text-primary animate-bounce" />
        </div>
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          Redirecting...
        </h1>
        <p className="max-w-[600px] mx-auto text-muted-foreground md:text-xl">
          This is a preview. In a live production environment, visitors would be redirected to your destination URL.
        </p>
        <div className="flex justify-center">
            <Button asChild size="lg">
                <a href={settings.redirectUrl} target="_blank" rel="noopener noreferrer">
                  Go to Destination
                  <ExternalLink className="ml-2" />
                </a>
            </Button>
        </div>
      </div>
    </main>
  );
}
