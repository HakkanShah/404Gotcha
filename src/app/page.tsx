
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { addVisit } from '@/lib/visits';
import { sendVisitNotification } from '@/lib/email';
import { filterBotTraffic } from '@/ai/flows/filter-bot-traffic';
import { parseUserAgent } from '@/lib/utils';
import type { Visit } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ExternalLink, Rocket } from 'lucide-react';
import { settings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

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
  const headerList = headers();
  const { redirectUrl, statsPassword } = settings;

  // If no settings, redirect to setup page.
  if (!redirectUrl || !statsPassword) {
    redirect('/setup');
  }

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

  // Conditionally redirect to avoid iframe issues in preview.
  const isIframe = headerList.get('sec-fetch-dest') === 'iframe';
  if (!isIframe) {
    redirect(redirectUrl!);
  }

  // Fallback for iFrame view
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="text-center space-y-4">
        <div className="relative w-24 h-24 mx-auto">
          <Rocket className="w-full h-full text-primary animate-bounce" />
        </div>
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          Engaging Warp Speed!
        </h1>
        <p className="max-w-[600px] mx-auto text-muted-foreground md:text-xl">
          You are being redirected to your destination. Please wait a moment.
        </p>
        <div className="flex justify-center">
            <Button asChild size="lg">
                <a href={redirectUrl} target="_blank" rel="noopener noreferrer">
                  Go to Destination
                  <ExternalLink className="ml-2" />
                </a>
            </Button>
        </div>
        <p className="text-sm text-muted-foreground pt-4">
            If you are not redirected automatically, please click the button above.
          </p>
      </div>
    </main>
  );
}
