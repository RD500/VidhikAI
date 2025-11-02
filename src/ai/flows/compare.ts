/**
 * @fileOverview Flow for comparing two legal documents.
 */
'use server';

import { ai } from '@/ai/genkit';
import { vertexAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

const ClauseComparisonSchema = z.object({
    clause: z.string().describe("The name or a summary of the clause, in English."),
    documentA_details: z.string().describe("The specific text or summary from Document A, in English."),
    documentB_details: z.string().describe("The specific text or summary from Document B, in English."),
    change_description: z.string().describe("A detailed description of how the clause has changed, explaining the practical impact of the modification, in English."),
  });
  
  const CompareDocumentsOutputSchema = z.object({
      summary: z.string().describe("A detailed, multi-paragraph summary of the key differences between the two documents. Explain the overall significance of the changes, in English."),
      newClauses: z.array(z.object({
          clause: z.string().describe("The new clause or term introduced, in English."),
          description: z.string().describe("A detailed explanation of what the new clause means and its potential impact on the user, in English."),
      })).describe("An exhaustive list of all significant clauses or terms present in Document B but not in Document A."),
      changedTerms: z.array(ClauseComparisonSchema).describe("An exhaustive list of terms or clauses that have been modified between the two documents."),
      deletedClauses: z.array(z.object({
          clause: z.string().describe("The clause or term that was removed, in English."),
          description: z.string().describe("A detailed explanation of the potential impact and risks associated with this removal, in English."),
      })).describe("An exhaustive list of all significant clauses or terms present in Document A but removed from Document B."),
  });
  
  const CompareDocumentsInputSchema = z.object({ docA: z.string(), docB: z.string() });
  
  export type CompareDocumentsOutput = z.infer<typeof CompareDocumentsOutputSchema>;
  export type CompareDocumentsInput = z.infer<typeof CompareDocumentsInputSchema>;

  
  export const compareDocumentsFlow = ai.defineFlow(
    {
      name: 'compareDocumentsFlow',
      inputSchema: CompareDocumentsInputSchema,
      outputSchema: CompareDocumentsOutputSchema,
    },
    async (input) => {
  
      const prompt = `You are a "Master Legal Analyst" AI with multilingual capabilities. Your task is to perform an exceptionally detailed comparison between two legal documents: Document A and Document B.

      First, perform OCR on both documents to extract their full text content. Then, use that extracted text to perform the comparison.
      Your entire analysis must be based **exclusively** on the text you extract from Document A and Document B.
      
      1.  **Exhaustively Analyze Document A:** Meticulously parse every clause, term, and obligation from its text.
      2.  **Exhaustively Analyze Document B:** Meticulously parse every clause, term, and obligation from its text.
      3.  **Synthesize and Compare:** Based on your deep analysis of the extracted texts, generate a highly detailed comparison report with the following sections, all written in English:
          *   **Detailed Summary:** Provide an in-depth, multi-paragraph overview of the most important changes. Don't just list the changes; explain the strategic importance and potential consequences of these modifications.
          *   **New Clauses:** Identify *every* significant clause that is present in Document B but was not in Document A. For each, explain its legal and practical implications for the user.
          *   **Changed Terms:** Identify *every* clause that exists in both documents but has been modified. For each, detail the original text (from A), the new text (from B), and provide a deep analysis of what the change means legally and practically.
          *   **Deleted Clauses:** Identify *every* significant clause that was in Document A but has been removed from Document B. For each, provide a thorough explanation of the risks, loss of rights, or changes in obligations that result from this removal.
      
      CRITICAL INSTRUCTIONS:
      *   The output MUST be in English.
      *   Your entire analysis MUST be derived solely from the provided document texts. Do not use any other information.
      *   The output MUST be a valid JSON object matching the provided schema.
      *   Do not include any disclaimers or introductory text outside of the schema.
      `;
  
      const llmResponse = await ai.generate({
        model: vertexAI.model('gemini-2.5-pro'),
        prompt: [
            { text: prompt },
            { text: "DOCUMENT A:" },
            { media: { url: input.docA } },
            { text: "DOCUMENT B:" },
            { media: { url: input.docB } },
        ],
        output: {
          schema: CompareDocumentsOutputSchema,
        }
      });
      return llmResponse.output!;
    }
  );
