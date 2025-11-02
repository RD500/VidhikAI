/**
 * @fileOverview Flow for demystifying a legal document.
 */
'use server';

import { ai } from '@/ai/genkit';
import { vertexAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

const JargonTermSchema = z.object({
  term: z.string().describe('The complex legal term.'),
  definition: z.string().describe('The simple, easy-to-understand explanation of the term, in English.'),
});

const ObligationSchema = z.object({
    description: z.string().describe("A clear and concise description of the obligation or deadline, in English."),
    date: z.string().describe("The specific date or timeframe for the obligation (e.g., 'YYYY-MM-DD', 'Within 30 days of signing')."),
});

const RiskSchema = z.object({
    clause: z.string().describe("A summary of the clause that contains the risk, in English."),
    riskLevel: z.enum(['High', 'Medium', 'Low']).describe("The categorized risk level."),
    explanation: z.string().describe("A simple explanation of why this clause is a potential risk, in English."),
});

const PiiSchema = z.object({
    entity: z.string().describe('The detected PII entity (e.g., name, address).'),
    original_text: z.string().describe('The original text of the PII.'),
    masked_text: z.string().describe('The masked version of the PII.'),
  });

const DemystifyDocumentOutputSchema = z.object({
  summary: z.string().describe('A high-level summary of the document\'s key features and clauses, formatted in markdown and written in English.'),
  jargonBuster: z.array(JargonTermSchema).describe('A list of complex legal terms and their simple definitions, in English.'),
  suggestedQuestions: z.array(z.string()).describe('A list of 3-5 key questions a user should ask about the document, in English.'),
  obligations: z.array(ObligationSchema).describe("A chronological list of key dates, deadlines, and recurring obligations found in the document, in English."),
  riskAnalysis: z.array(RiskSchema).describe("A proactive analysis of potentially risky or unfavorable clauses, in English."),
  text: z.string().describe('The full, extracted text from the document.'),
  pii: z.array(PiiSchema).describe('A list of all personally identifiable information found and masked in the document.'),
});

const DemystifyDocumentInputSchema = z.object({ 
    documentUri: z.string(),
});


export type DemystifyDocumentOutput = z.infer<typeof DemystifyDocumentOutputSchema>;
export type DemystifyDocumentInput = z.infer<typeof DemystifyDocumentInputSchema>;


export const demystifyDocumentFlow = ai.defineFlow(
    {
      name: 'demystifyDocumentFlow',
      inputSchema: DemystifyDocumentInputSchema,
      outputSchema: DemystifyDocumentOutputSchema,
    },
    async (input) => {
        const prompt = `You are "Vidhik," an expert AI legal assistant specializing in multilingual document analysis. Your primary goal is to perform multiple tasks on a given document in one single step and with exceptionally high detail.

        You will be provided with a document, which could be an image or have text. Your entire analysis must be based **exclusively** on this provided document.
        
        Perform the following six tasks with maximum detail, ensuring all output is in English and derived solely from the provided document:
        
        1.  **Perform OCR (if necessary) and Extract Full Text:** First, extract all text from the document. This is the most crucial step. The extracted text will be the context for all subsequent tasks. The final output object must include this full, unmasked text in the 'text' field.

        2.  **Identify and Mask PII:** From the extracted text, identify all Personally Identifiable Information (PII) like names, addresses, emails, phone numbers, etc. Create a list of these PII entities, including their original form and a masked version.
        
        3.  **Generate a Detailed Feature Summary:** Create an in-depth, multi-paragraph summary in English based on the extracted text. Explain the document's purpose, the parties involved, the core rights and responsibilities of each party, and the most critical outcomes or consequences. Use markdown with nested bullet points and bold text to structure the information logically and highlight key points.
        
        4.  **Create a Comprehensive Jargon Buster:** Identify an extensive list of legal and technical terms from the extracted text. For each term, provide a thorough, easy-to-understand explanation in English. Explain its significance and implication within the context of this specific document.
        
        5.  **Suggest Insightful Key Questions:** Based on a deep analysis of the provided text, generate a list of 3 to 5 insightful and practical questions in English. These questions should probe potential ambiguities, risks, or unstated assumptions that the user must clarify.
        
        6.  **Extract All Obligations & Deadlines:** Meticulously scan the extracted text for every key date, deadline, condition, and recurring obligation for all parties. For each item, provide a clear description and the exact timing or trigger. Be exhaustive.
        
        7.  **Perform Granular Risk Analysis:** Proactively identify and flag every clause from the extracted text that could be potentially risky, ambiguous, or unfavorable. For each risk, specify the exact clause, categorize it as 'High', 'Medium', or 'Low', and provide a detailed explanation in simple English of why it is a concern and what the potential negative consequences are.
        
        CRITICAL INSTRUCTIONS:
        *   Your analysis MUST be based **only** on the text in the provided document. Do not invent information or use external knowledge.
        *   The source document may not be in English. You must understand it and produce all output in English.
        *   Do NOT include a disclaimer in your response. The output will be used in a structured format.
        *   The output MUST be a valid JSON object matching the provided schema.
        `;

        const llmResponse = await ai.generate({
            model: vertexAI.model('gemini-2.5-pro'),
            prompt: [
              { text: prompt },
              { media: { url: input.documentUri } }
            ],
            output: {
                schema: DemystifyDocumentOutputSchema,
            }
        });
        
        return llmResponse.output!;
    }
);
