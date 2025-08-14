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
  prompt: `You are an expert in identifying bot traffic.

  You are given the following information about a visitor:
  User Agent: {{{userAgent}}}
  IP Address: {{{ipAddress}}}
  Referrer URL: {{{referrer}}}

  Based on this information, determine if the visit is from a bot.
  If the visit is from a bot, set isBot to true and provide a reason why the visit is classified as bot traffic.
  If the visit is not from a bot, set isBot to false and the reason to an empty string.
  Keep the reason short and concise.
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
