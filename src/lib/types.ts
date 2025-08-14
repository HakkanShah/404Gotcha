export interface Visit {
  id: string;
  timestamp: string;
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  org?: string;
  userAgent: string;
  os: string;
  browser: string;
  device: string;
  referrer: string;
  isBot: boolean;
  botReason?: string;
}
