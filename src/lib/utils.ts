import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseUserAgent(userAgent: string) {
  let os = 'Unknown';
  let browser = 'Unknown';
  let device = 'Desktop';

  if (!userAgent) return { os, browser, device };

  if (/mobile/i.test(userAgent)) device = 'Mobile';
  if (/tablet/i.test(userAgent)) device = 'Tablet';
  if (/smart-tv/i.test(userAgent) || /tv/i.test(userAgent)) device = 'TV';
  if (/bot/i.test(userAgent) || /spider/i.test(userAgent) || /crawler/i.test(userAgent)) device = 'Bot';


  const osMatch = userAgent.match(/\(([^)]+)\)/);
  if (osMatch) {
    const platform = osMatch[1];
    if (platform.includes('Windows')) os = 'Windows';
    else if (platform.includes('Macintosh') || platform.includes('Mac OS')) os = 'macOS';
    else if (platform.includes('Linux')) os = 'Linux';
    else if (platform.includes('Android')) os = 'Android';
    else if (platform.includes('iPhone') || platform.includes('iPad')) os = 'iOS';
  }

  if (userAgent.includes('Firefox/')) browser = 'Firefox';
  else if (userAgent.includes('SamsungBrowser/')) browser = 'Samsung Browser';
  else if (userAgent.includes('Edg/')) browser = 'Edge';
  else if (userAgent.includes('Chrome/')) browser = 'Chrome';
  else if (userAgent.includes('Safari/')) browser = 'Safari';

  if (browser === 'Chrome' && userAgent.includes('Safari/')) {
      // Many browsers include both Chrome and Safari in their UA string.
      // If it's not Edge or Samsung, it's likely Chrome.
  } else if (browser === 'Safari' && userAgent.includes('Chrome/')) {
    browser = 'Chrome';
  }


  return { os, browser, device };
}
