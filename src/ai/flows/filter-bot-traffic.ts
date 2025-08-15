
'use server';

/**
 * @fileOverview A flow to determine if a visit is from a bot or not.
 *
 * - filterBotTraffic - A function that determines if a visit is from a bot.
 * - FilterBotTrafficInput - The input type for the filterBotTraffic function.
 * - FilterBotTrafficOutput - The return type for the filterBotTraffic function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FilterBotTrafficInputSchema = z.object({
  userAgent: z.string().describe('The user agent of the visitor.'),
  ipAddress: z.string().describe('The IP address of the visitor.'),
  referrer: z.string().describe('The referrer URL of the visitor.'),
});
export type FilterBotTrafficInput = z.infer<typeof FilterBotTrafficInputSchema>;

const FilterBotTrafficOutputSchema = z.object({
  isBot: z.boolean().describe('Whether or not the visit is from a bot.'),
  reason: z.string().describe('The reason why the visit is classified as bot traffic.'),
});
export type FilterBotTrafficOutput = z.infer<typeof FilterBotTrafficOutputSchema>;

export async function filterBotTraffic(input: FilterBotTrafficInput): Promise<FilterBotTrafficOutput> {
  return filterBotTrafficFlow(input);
}

const prompt = ai.definePrompt({
  name: 'filterBotTrafficPrompt',
  input: {schema: FilterBotTrafficInputSchema},
  output: {schema: FilterBotTrafficOutputSchema},
  prompt: `You are an expert in identifying bot traffic from web request headers.

  Analyze the following visitor information to determine if it is a bot.

  - User Agent: {{{userAgent}}}
  - IP Address: {{{ipAddress}}}
  - Referrer URL: {{{referrer}}}

  Here are your rules for classification:
  1.  **High-Confidence Bot Indicators:** If the User Agent contains terms like 'bot', 'spider', 'crawler', 'headless', or is very unusual (e.g., 'node'), classify it as a bot.
  2.  **Suspicious Referrers:** If the referrer is from a known cloud development environment (e.g., 'cloudworkstations.dev', 'gitpod.io') or a known analytics-blocker, it's likely a bot.
  3.  **Local & Private IPs:** Be cautious with IPs like '127.0.0.1' or private network IPs. These often indicate development or testing, but don't automatically classify them as bots unless the User Agent or Referrer is also suspicious. A real user might be behind a VPN.
  4.  **Direct Traffic:** A referrer of 'Direct' or empty is common for real users. Do not classify this as a bot on its own.

  Based on these rules, determine if the visit is from a bot. Provide a concise, clear reason for your decision if you identify a bot. If it appears to be a human, set isBot to false.
  `,
});

const filterBotTrafficFlow = ai.defineFlow(
  {
    name: 'filterBotTrafficFlow',
    inputSchema: FilterBotTrafficInputSchema,
    outputSchema: FilterBotTrafficOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
