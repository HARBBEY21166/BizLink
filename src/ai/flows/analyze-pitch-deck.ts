// src/ai/flows/analyze-pitch-deck.ts
'use server';
/**
 * @fileOverview An AI agent that analyzes pitch decks and provides feedback.
 *
 * - analyzePitchDeck - A function that handles the pitch deck analysis process.
 * - AnalyzePitchDeckInput - The input type for the analyzePitchDeck function.
 * - AnalyzePitchDeckOutput - The return type for the analyzePitchDeck function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzePitchDeckInputSchema = z.object({
  pitchDeckDataUri: z
    .string()
    .describe(
      "The pitch deck document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzePitchDeckInput = z.infer<typeof AnalyzePitchDeckInputSchema>;

const AnalyzePitchDeckOutputSchema = z.object({
  score: z.number().describe('The overall score of the pitch deck (0-100).'),
  strengths: z.string().describe('A summary of the strengths of the pitch deck.'),
  weaknesses: z.string().describe('A summary of the weaknesses of the pitch deck.'),
  advice: z.string().describe('Specific advice for improving the pitch deck.'),
});
export type AnalyzePitchDeckOutput = z.infer<typeof AnalyzePitchDeckOutputSchema>;

export async function analyzePitchDeck(input: AnalyzePitchDeckInput): Promise<AnalyzePitchDeckOutput> {
  return analyzePitchDeckFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzePitchDeckPrompt',
  input: {schema: AnalyzePitchDeckInputSchema},
  output: {schema: AnalyzePitchDeckOutputSchema},
  // Removed explicit model, will use default from genkit.ts
  prompt: `You are an expert venture capitalist specializing in early-stage startups.

You will be provided with a pitch deck and will analyze it to determine its strengths and weaknesses.
Based on this, you will provide a score between 0 and 100, a summary of the strengths, a summary of the weaknesses, and specific advice for improving the pitch deck.

Analyze the following pitch deck:

{{media url=pitchDeckDataUri}}`,
});

const analyzePitchDeckFlow = ai.defineFlow(
  {
    name: 'analyzePitchDeckFlow',
    inputSchema: AnalyzePitchDeckInputSchema,
    outputSchema: AnalyzePitchDeckOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
