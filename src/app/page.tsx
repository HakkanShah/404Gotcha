
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { addVisit } from '@/lib/visits';
import { sendVisitNotification } from '@/lib/email';
import { filterBotTraffic } from '@/ai/flows/filter-bot-traffic';
import { parseUserAgent } from '@/lib/utils';
import type { Visit } from '@/lib/types';
import { getSettings } from '@/lib/settings';

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

  redirect(settings.redirectUrl);
}
